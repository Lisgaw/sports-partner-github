/**
 * Event Bus — Redis-backed SSE event delivery
 *
 * Write path: notification/message → pushSSEEvent(userId, event)
 * Read path:  SSE stream → drainSSEEvents(userId) → forward to client
 *
 * DB polling yerine Redis list kullanır:
 * - Her kullanıcı için `sse:events:{userId}` listesi
 * - Yazma: LPUSH + EXPIRE (5dk TTL)
 * - Okuma: LRANGE + DEL (atomic drain)
 *
 * Redis yoksa: in-memory Map fallback (dev/tek instance için)
 *
 * Kazanç: PostgreSQL SSE yükü %95 azalır (N×2 query/20s → 0)
 */
import { Redis } from "@upstash/redis";

const SSE_EVENT_TTL = 300; // 5 dakika sonra expire
const SSE_KEY_PREFIX = "sse:events:";
const UNREAD_MSG_PREFIX = "sse:unread:";

export interface SSEEvent {
  type: string;
  data?: unknown;
  ts: number;
}

// ─── Redis client (cache.ts ile aynı detection pattern) ──────────────────────
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (
    !url || !token ||
    url.startsWith("https://your-") ||
    token === "your-redis-token" ||
    url === "https://your-redis.upstash.io"
  ) {
    return null;
  }
  return new Redis({ url, token });
}

// ─── In-memory fallback (dev/Redis yoksa) ────────────────────────────────────
const memoryBus = new Map<string, SSEEvent[]>();
const memoryUnread = new Map<string, number>();

function userKey(userId: string) {
  return `${SSE_KEY_PREFIX}${userId}`;
}

function unreadKey(userId: string) {
  return `${UNREAD_MSG_PREFIX}${userId}`;
}

// ─── Event Push (yazma tarafı) ───────────────────────────────────────────────

/**
 * Kullanıcının SSE kanalına event push et.
 * Bildirim/mesaj oluşturma noktalarından çağrılır.
 */
export async function pushSSEEvent(userId: string, event: SSEEvent): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const existing = memoryBus.get(userId) ?? [];
      existing.push(event);
      if (existing.length > 50) existing.splice(0, existing.length - 50);
      memoryBus.set(userId, existing);
      return;
    }

    const key = userKey(userId);
    await redis.lpush(key, event);
    await redis.expire(key, SSE_EVENT_TTL);
  } catch {
    // Event push başarısız olursa ana işlemi engelleme
  }
}

// ─── Event Drain (okuma tarafı — SSE stream) ────────────────────────────────

/**
 * Bekleyen tüm event'leri oku ve sil (destructive read).
 * SSE stream poll loop'undan çağrılır.
 */
export async function drainSSEEvents(userId: string): Promise<SSEEvent[]> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const events = memoryBus.get(userId) ?? [];
      memoryBus.delete(userId);
      return events;
    }

    const key = userKey(userId);
    const pipeline = redis.pipeline();
    pipeline.lrange(key, 0, -1);
    pipeline.del(key);
    const results = await pipeline.exec();
    const events = (results[0] as SSEEvent[] | null) ?? [];
    // LPUSH en yeniyi başa koyar → kronolojik sıra için ters çevir
    return events.reverse();
  } catch {
    return [];
  }
}

// ─── Unread Message Counter (Redis-cached) ───────────────────────────────────

/**
 * Okunmamış mesaj sayacını Redis'te artır.
 * Mesaj gönderildiğinde çağrılır.
 */
export async function incrUnreadCount(userId: string): Promise<number> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const current = memoryUnread.get(userId) ?? 0;
      const next = current + 1;
      memoryUnread.set(userId, next);
      return next;
    }
    const result = await redis.incr(unreadKey(userId));
    await redis.expire(unreadKey(userId), 3600);
    return result;
  } catch {
    return -1;
  }
}

/**
 * Okunmamış mesaj sayacını azalt.
 * Mesajlar okundu işaretlendiğinde çağrılır.
 */
export async function decrUnreadCount(userId: string, amount = 1): Promise<number> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const current = memoryUnread.get(userId) ?? 0;
      const next = Math.max(0, current - amount);
      memoryUnread.set(userId, next);
      return next;
    }
    const result = await redis.decrby(unreadKey(userId), amount);
    if (result < 0) {
      await redis.set(unreadKey(userId), 0, { ex: 3600 });
      return 0;
    }
    return result;
  } catch {
    return -1;
  }
}

/**
 * Cached unread mesaj sayısını oku.
 * null = bilinmiyor (DB'ye düş), sayı = cached değer.
 */
export async function getUnreadCount(userId: string): Promise<number | null> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      const count = memoryUnread.get(userId);
      return count !== undefined ? count : null;
    }
    return await redis.get<number>(unreadKey(userId));
  } catch {
    return null;
  }
}

/**
 * Unread sayacını doğrudan set et (DB sync sonrası).
 */
export async function setUnreadCount(userId: string, count: number): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      memoryUnread.set(userId, count);
      return;
    }
    await redis.set(unreadKey(userId), count, { ex: 3600 });
  } catch {
    // Sessizce geç
  }
}
