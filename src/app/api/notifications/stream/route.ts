import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import { createLogger } from "@/lib/logger";
import { drainSSEEvents, getUnreadCount, setUnreadCount } from "@/lib/event-bus";

const log = createLogger("sse:notifications");

// SSE bağlantı başına maksimum ömür (ms). Bağlantı bu süre dolunca kapatılır;
// istemci EventSource'u otomatik yeniden bağlar. Sunucudaki bağlantı sayısını sınırlar.
const SSE_MAX_LIFETIME_MS = 5 * 60 * 1000; // 5 dakika

// Polling aralıkları:
// - Redis varken: 10s (Redis sub-ms, neredeyse bedava)
// - Redis yokken: 30s (DB sorgusu, ama daha seyrek)
const SSE_POLL_REDIS_MS = 10_000;
const SSE_POLL_DB_MS = 30_000;

// DB truth sync aralığı: Redis varken bile 60s'de bir DB'den doğrula
const DB_SYNC_INTERVAL_MS = 60_000;

// GET /api/notifications/stream — Server-Sent Events
// Event-driven: yazma tarafı pushSSEEvent() ile Redis'e push eder,
// okuma tarafı drainSSEEvents() ile Redis'ten çeker → DB sorgusu %95 azalır.
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let lastCheck = new Date();
  let lastDbSync = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

      const send = (data: unknown) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          // bağlantı kapandı
        }
      };

      // İlk bağlantıda DB'den unread count'u Redis'e sync et
      try {
        const initialUnread = await prisma.message.count({
          where: { receiverId: userId, read: false },
        });
        await setUnreadCount(userId, initialUnread);
        send({ type: "heartbeat", unreadMessages: initialUnread, ts: Date.now() });
      } catch {
        // İlk sync başarısız olursa devam et
      }

      // Redis event-bus kontrolü: Redis varsa hızlı+hafif poll, yoksa yavaş DB poll
      const hasRedis = await getUnreadCount(userId) !== null;
      const pollInterval = hasRedis ? SSE_POLL_REDIS_MS : SSE_POLL_DB_MS;

      const interval = setInterval(async () => {
        if (req.signal.aborted) {
          clearInterval(interval);
          return;
        }

        try {
          const now = Date.now();

          if (hasRedis) {
            // ── Redis path: drain event bus (sub-ms, DB sorgusu YOK) ──
            const events = await drainSSEEvents(userId);
            for (const event of events) {
              send(event);
            }

            // Cached unread count (Redis GET, DB yok)
            let unreadMessages = await getUnreadCount(userId) ?? 0;

            // 60 saniyede bir DB'den doğrula (eventual consistency safety net)
            if (now - lastDbSync > DB_SYNC_INTERVAL_MS) {
              const dbUnread = await prisma.message.count({
                where: { receiverId: userId, read: false },
              });
              await setUnreadCount(userId, dbUnread);
              unreadMessages = dbUnread;
              lastDbSync = now;
            }

            send({ type: "heartbeat", unreadMessages, ts: now });
          } else {
            // ── DB fallback path (Redis yokken): eski davranış, daha seyrek ──
            const [newNotifs, unreadMessages] = await Promise.all([
              prisma.notification.findMany({
                where: { userId, createdAt: { gt: lastCheck } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { id: true, type: true, title: true, body: true, link: true, read: true, createdAt: true },
              }),
              prisma.message.count({
                where: { receiverId: userId, read: false },
              }),
            ]);

            if (newNotifs.length > 0) {
              send({ type: "notifications", data: newNotifs });
            }

            send({ type: "heartbeat", unreadMessages, ts: now });
            lastCheck = new Date();
          }
        } catch (err) {
          log.error("SSE poll hatası", err);
        }
      }, pollInterval);

      // Maksimum bağlantı ömrü: SSE_MAX_LIFETIME_MS sonra kapat, istemci yeniden bağlanır.
      const lifetimeTimer = setTimeout(() => {
        clearInterval(interval);
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "reconnect" })}\n\n`);
          controller.close();
        } catch { /* ignore */ }
      }, SSE_MAX_LIFETIME_MS);

      // Bağlantı kesilince temizle
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearTimeout(lifetimeTimer);
        try { controller.close(); } catch { /* ignore */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
