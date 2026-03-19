import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CACHE_TTL, cacheGet, cacheIncr, cacheSet } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

const log = createLogger("feed:snapshot");

const FEED_PAGE_SIZE = 12;
const FEED_SNAPSHOT_MAX_ITEMS = 120;
const FEED_GLOBAL_VERSION_KEY = "feed:snapshot:global-version";

// Single-flight deduplicator: aynı anda aynı userId için paralel buildSnapshot çağrılarını
// tek bir DB işlemine indirir (thundering herd önleme).
const buildInFlight = new Map<string, Promise<FeedSnapshot | null>>();

type FeedListingRow = {
  id: string;
  type: string;
  dateTime: Date;
  level: string | null;
  status: string;
  description: string | null;
  maxParticipants: number;
  sport: { id: string; name: string; icon: string | null };
  district: {
    name: string;
    city: { name: string; country: { name: string } };
  } | null;
  city: {
    id: string;
    name: string;
    countryId: string | null;
    country: { id: string; name: string; code: string | null };
  } | null;
  venue: { name: string } | null;
  user: { id: string; name: string; avatarUrl: string | null };
  _count: { responses: number };
};

type FeedListingCard = FeedListingRow & {
  isFromFollowing: boolean;
  isGroup: boolean;
};

type FeedSnapshot = {
  userId: string;
  pageSize: number;
  total: number;
  generatedAt: string;
  items: FeedListingCard[];
};

type FeedContext = {
  followingSet: Set<string>;
  finalWhere: Prisma.ListingWhereInput;
};

type FeedPayload = {
  success: true;
  data: FeedListingCard[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

function userVersionKey(userId: string) {
  return `feed:snapshot:user-version:${userId}`;
}

function snapshotKey(userId: string, globalVersion: number, userVersion: number) {
  return `feed:snapshot:v2:${userId}:g${globalVersion}:u${userVersion}`;
}

function latestSnapshotKey(userId: string) {
  return `feed:snapshot:latest:${userId}`;
}

async function readVersion(key: string) {
  const current = await cacheGet<number>(key);
  if (typeof current === "number" && Number.isFinite(current) && current > 0) {
    return current;
  }
  await cacheSet(key, 1, CACHE_TTL.FEED_VERSION);
  return 1;
}

async function getFeedContext(userId: string): Promise<FeedContext | null> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      cityId: true,
      sports: { select: { id: true } },
      following: { where: { status: "ACCEPTED" }, select: { followingId: true } },
    },
  });

  if (!me) {
    return null;
  }

  const followingIds = me.following.map((f) => f.followingId);
  const sportIds = me.sports.map((sport) => sport.id);

  const where: Prisma.ListingWhereInput = {
    status: "OPEN",
    dateTime: { gte: new Date() },
    userId: { not: userId },
    OR: [
      ...(followingIds.length > 0 ? [{ userId: { in: followingIds } }] : []),
      ...(sportIds.length > 0 ? [{ sportId: { in: sportIds } }] : []),
      ...(me.cityId ? [{ district: { city: { id: me.cityId } } }, { cityId: me.cityId }] : []),
    ],
  };

  const hasSignals = followingIds.length > 0 || sportIds.length > 0 || me.cityId;
  const finalWhere = hasSignals
    ? where
    : { status: "OPEN", dateTime: { gte: new Date() } } satisfies Prisma.ListingWhereInput;

  return {
    followingSet: new Set(followingIds),
    finalWhere,
  };
}

async function fetchFeedRows(where: Prisma.ListingWhereInput, skip: number, take: number) {
  return prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      type: true,
      dateTime: true,
      level: true,
      status: true,
      description: true,
      maxParticipants: true,
      sport: { select: { id: true, name: true, icon: true } },
      district: {
        select: {
          name: true,
          city: { select: { name: true, country: { select: { name: true } } } },
        },
      },
      city: {
        select: {
          id: true,
          name: true,
          countryId: true,
          country: { select: { id: true, name: true, code: true } },
        },
      },
      venue: { select: { name: true } },
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { responses: true } },
    },
  });
}

function enrichRows(rows: FeedListingRow[], followingSet: Set<string>): FeedListingCard[] {
  return rows.map((row) => ({
    ...row,
    isFromFollowing: followingSet.has(row.user.id),
    isGroup: row.maxParticipants > 2,
  }));
}

function buildPagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page * pageSize < total,
    hasPrev: page > 1,
  };
}

function buildPayload(snapshot: FeedSnapshot, page: number): FeedPayload {
  const start = (page - 1) * snapshot.pageSize;
  const end = start + snapshot.pageSize;
  return {
    success: true,
    data: snapshot.items.slice(start, end),
    pagination: buildPagination(snapshot.total, page, snapshot.pageSize),
  };
}

async function buildSnapshot(userId: string): Promise<FeedSnapshot | null> {
  // Single-flight: bu userId için zaten bir build işlemi varsa onu bekle, yenisini başlatma.
  const existing = buildInFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    const context = await getFeedContext(userId);
    if (!context) {
      return null;
    }

    const [total, rows] = await Promise.all([
      prisma.listing.count({ where: context.finalWhere }),
      fetchFeedRows(context.finalWhere, 0, FEED_SNAPSHOT_MAX_ITEMS),
    ]);

    return {
      userId,
      pageSize: FEED_PAGE_SIZE,
      total,
      generatedAt: new Date().toISOString(),
      items: enrichRows(rows, context.followingSet),
    } satisfies FeedSnapshot;
  })().finally(() => {
    buildInFlight.delete(userId);
  });

  buildInFlight.set(userId, promise);
  return promise;
}

async function cacheSnapshot(userId: string, snapshot: FeedSnapshot, globalVersion: number, userVersion: number) {
  await Promise.all([
    cacheSet(snapshotKey(userId, globalVersion, userVersion), snapshot, CACHE_TTL.FEED_SNAPSHOT),
    cacheSet(latestSnapshotKey(userId), snapshot, CACHE_TTL.FEED_SNAPSHOT_LATEST),
  ]);
}

export async function getFeedPayload(userId: string, page: number): Promise<{ payload: FeedPayload; source: string } | null> {
  const globalVersion = await readVersion(FEED_GLOBAL_VERSION_KEY);
  const userVersion = await readVersion(userVersionKey(userId));
  const versionedKey = snapshotKey(userId, globalVersion, userVersion);

  let snapshot = await cacheGet<FeedSnapshot>(versionedKey);
  let source = "snapshot-cache";

  if (!snapshot) {
    snapshot = await buildSnapshot(userId);
    if (!snapshot) return null;
    await cacheSnapshot(userId, snapshot, globalVersion, userVersion);
    source = "snapshot-build";
  }

  const precomputedPages = Math.ceil(snapshot.items.length / snapshot.pageSize);
  if (page <= Math.max(precomputedPages, 1) || snapshot.total <= snapshot.items.length) {
    return {
      payload: buildPayload(snapshot, page),
      source,
    };
  }

  const context = await getFeedContext(userId);
  if (!context) {
    return null;
  }

  const rows = await fetchFeedRows(context.finalWhere, (page - 1) * FEED_PAGE_SIZE, FEED_PAGE_SIZE);
  return {
    payload: {
      success: true,
      data: enrichRows(rows, context.followingSet),
      pagination: buildPagination(snapshot.total, page, FEED_PAGE_SIZE),
    },
    source: "live-tail",
  };
}

export async function getStaleFeedPayload(userId: string, page: number): Promise<FeedPayload | null> {
  const snapshot = await cacheGet<FeedSnapshot>(latestSnapshotKey(userId));
  if (!snapshot) return null;

  const precomputedPages = Math.ceil(snapshot.items.length / snapshot.pageSize);
  if (page > Math.max(precomputedPages, 1) && snapshot.total > snapshot.items.length) {
    return null;
  }

  return buildPayload(snapshot, page);
}

export async function bumpGlobalFeedVersion() {
  await cacheIncr(FEED_GLOBAL_VERSION_KEY);
}

export async function bumpUserFeedVersion(userId: string) {
  await cacheIncr(userVersionKey(userId));
}

export async function warmFeedSnapshot(userId: string) {
  try {
    const globalVersion = await readVersion(FEED_GLOBAL_VERSION_KEY);
    const userVersion = await readVersion(userVersionKey(userId));
    const snapshot = await buildSnapshot(userId);
    if (!snapshot) return;
    await cacheSnapshot(userId, snapshot, globalVersion, userVersion);
  } catch (error) {
    log.error("Feed snapshot warm hatası", { userId, error });
  }
}