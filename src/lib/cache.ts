import { Redis } from "@upstash/redis";

type MemoryCacheEntry = {
  value: unknown;
  expiresAt: number | null;
};

const memoryCache = new Map<string, MemoryCacheEntry>();

// Single-flight map: aynı cache key için paralel DB sorgularını tek sorguda birleştirir.
// Thundering herd (aynı anda çok sayıda cache miss → DB'ye aynı sorgu) sorununu önler.
const inFlightMap = new Map<string, Promise<unknown>>();

function getMemoryEntry(key: string): MemoryCacheEntry | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry;
}

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

let _redisWarnDone = false;

// Redis bağlantısı - env yoksa veya placeholder ise null döner (graceful degradation)
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  // Placeholder veya eksik değerler varsa Redis'i devre dışı bırak
  if (
    !url || !token ||
    url.startsWith("https://your-") ||
    token === "your-redis-token" ||
    url === "https://your-redis.upstash.io"
  ) {
    if (process.env.NODE_ENV === "production" && !_redisWarnDone) {
      console.warn("[cache] UPSTASH_REDIS_REST_URL/TOKEN not configured — falling back to in-process memory cache. This does NOT scale across multiple instances.");
      _redisWarnDone = true;
    }
    return null;
  }
  return new Redis({ url, token });
}

// Cache TTL değerleri (saniye)
export const CACHE_TTL = {
  LISTINGS: 60,          // İlan listesi: 1 dakika
  VENUES: 60 * 60 * 24, // Mekan listesi: 24 saat
  PLACES: 60 * 60 * 24, // Google Places sonuçları: 24 saat
  SPORTS: 60 * 60,       // Spor listesi: 1 saat
  LEADERBOARD: 60 * 5,   // Liderlik tablosu: 5 dakika
  PROFILE: 60 * 5,       // Profil: 5 dakika
  FEED_SNAPSHOT: 60,
  FEED_SNAPSHOT_LATEST: 60 * 5,
  FEED_VERSION: 60 * 60 * 24 * 30,
  BLOCKLIST: 60,         // Engelleme listesi: 1 dakika (blok oluşturulunca invalidate edilecek)
} as const;

// Cache key oluşturucu - tutarlı key formatı
export const cacheKey = {
  listings: (filters: Record<string, unknown>) =>
    `listings:${JSON.stringify(filters)}`,
  venues: (districtId: string, sportId?: string) =>
    `venues:${districtId}:${sportId ?? "all"}`,
  googlePlaces: (query: string, lat: number, lng: number) =>
    `places:${query}:${lat.toFixed(3)}:${lng.toFixed(3)}`,
  sports: () => "sports:all",
  leaderboard: (sportId?: string) => `leaderboard:${sportId ?? "all"}`,
  profile: (userId: string) => `profile:${userId}`,
  userListings: (userId: string) => `user-listings:${userId}`,
  blocklist: (userId: string) => `blocklist:${userId}`,
} as const;

// Cache'den veri al
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const entry = getMemoryEntry(key);
      return (entry?.value as T | undefined) ?? null;
    }
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch {
    return null; // Redis hata verse bile uygulama devam eder
  }
}

// Cache'e veri yaz
export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      memoryCache.set(key, {
        value,
        expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
      });
      return;
    }
    await redis.set(key, value, { ex: ttl });
  } catch {
    // Sessizce geç
  }
}

// Cache'den sil
export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      memoryCache.delete(key);
      return;
    }
    await redis.del(key);
  } catch {
    // Sessizce geç
  }
}

// Pattern ile toplu silme (örn: "listings:*")
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const matcher = patternToRegExp(pattern);
      for (const key of memoryCache.keys()) {
        if (matcher.test(key)) {
          memoryCache.delete(key);
        }
      }
      return;
    }
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Sessizce geç
  }
}

export async function cacheIncr(key: string, amount = 1): Promise<number> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const current = getMemoryEntry(key);
      const baseValue = typeof current?.value === "number" ? current.value : 0;
      const nextValue = baseValue + amount;
      memoryCache.set(key, {
        value: nextValue,
        expiresAt: Date.now() + CACHE_TTL.FEED_VERSION * 1000,
      });
      return nextValue;
    }
    return await redis.incrby(key, amount);
  } catch {
    return amount;
  }
}

// Cache-aside wrapper: varsa getir, yoksa hesapla ve kaydet
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  // Single-flight: aynı key için zaten uçuşta bir Promise varsa yenisini başlatma,
  // varolan Promise'i bekle. Bu thundering herd sorununu önler.
  const existing = inFlightMap.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().then(async (result) => {
    await cacheSet(key, result, ttl);
    inFlightMap.delete(key);
    return result;
  }).catch((err) => {
    inFlightMap.delete(key);
    throw err;
  });

  inFlightMap.set(key, promise);
  return promise;
}
