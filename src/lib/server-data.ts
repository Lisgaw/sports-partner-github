import { Prisma } from "@prisma/client";
import { prismaRead } from "@/lib/prisma";
import { withCache, CACHE_TTL, cacheKey } from "@/lib/cache";
import type { ListingSummary, Country, Sport } from "@/types";

// Server-side data fetching functions — tüm okumalar read replica üzerinden; withCache ile thundering herd koruması

export async function getInitialListings(countryId?: string): Promise<{
  listings: ListingSummary[];
  total: number;
  pageSize: number;
}> {
  const cacheKeyStr = `listings:initial:${countryId ?? "all"}`;
  return withCache(cacheKeyStr, CACHE_TTL.LISTINGS, async () => {
    const now = new Date();
    const pageSize = 12;

    const where: Prisma.ListingWhereInput = {
      status: "OPEN" as const,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        { OR: [{ type: { in: ["EQUIPMENT", "VENUE_MEMBERSHIP", "VENUE_CLASS", "VENUE_PRODUCT", "VENUE_SERVICE"] as Prisma.EnumListingTypeFilter["in"] } }, { dateTime: { gte: now } }] },
      ],
      ...(countryId
        ? {
            OR: [
              { district: { city: { countryId } } },
              { city: { countryId } },
            ],
          }
        : {}),
    };

    const [total, listings] = await Promise.all([
      prismaRead.listing.count({ where }),
      prismaRead.listing.findMany({
        where,
        include: {
          sport: true,
          district: { include: { city: { include: { country: true } } } },
          city: { include: { country: true } },
          venue: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              gender: true,
              birthDate: true,
              preferredTime: true,
              preferredStyle: true,
            },
          },
          _count: { select: { responses: true } },
          equipmentDetail: { select: { price: true, isSold: true } },
        },
        orderBy: [{ isQuick: "desc" }, { dateTime: "asc" }],
        take: pageSize,
      }),
    ]);

    const sortedListings = [...listings].sort((a: any, b: any) => {
      const aPriority = (a.type === "RIVAL" || a.type === "PARTNER") ? 0 : 1;
      const bPriority = (b.type === "RIVAL" || b.type === "PARTNER") ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });

    return {
      listings: sortedListings as unknown as ListingSummary[],
      total,
      pageSize,
    };
  });
}

export async function getInitialLocations(): Promise<Country[]> {
  return withCache(
    cacheKey.locations(),
    CACHE_TTL.LOCATIONS,
    async () => {
      const countries = await prismaRead.country.findMany({
        include: {
          cities: {
            include: {
              districts: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      });
      return countries as unknown as Country[];
    }
  );
}

export async function getInitialSports(): Promise<Sport[]> {
  return withCache(
    cacheKey.sports(),
    CACHE_TTL.SPORTS,
    async () => {
      const sports = await prismaRead.sport.findMany({
        orderBy: { name: "asc" },
      });
      return sports as unknown as Sport[];
    }
  );
}

export async function getPopularListings(limit = 6): Promise<ListingSummary[]> {
  return withCache(`listings:popular:${limit}`, CACHE_TTL.POPULAR, async () => {
    const now = new Date();

    const listings = await prismaRead.listing.findMany({
      where: {
        status: "OPEN",
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          { OR: [{ type: { in: ["EQUIPMENT", "VENUE_MEMBERSHIP", "VENUE_CLASS", "VENUE_PRODUCT", "VENUE_SERVICE"] as Prisma.EnumListingTypeFilter["in"] } }, { dateTime: { gte: now } }] },
        ],
      },
      include: {
        sport: true,
        district: { include: { city: { include: { country: true } } } },
        city: { include: { country: true } },
        venue: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            gender: true,
            birthDate: true,
            preferredTime: true,
            preferredStyle: true,
          },
        },
        _count: { select: { responses: true } },
        equipmentDetail: { select: { price: true, isSold: true } },
      },
      orderBy: [
        { responses: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    return listings as unknown as ListingSummary[];
  });
}

export async function getTurkeyId(): Promise<string | null> {
  const turkey = await prismaRead.country.findFirst({
    where: { code: "TR" },
    select: { id: true },
  });
  return turkey?.id ?? null;
}
