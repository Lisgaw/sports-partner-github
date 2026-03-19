import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("sse:notifications");

// SSE bağlantı başına maksimum ömür (ms). Bağlantı bu süre dolunca kapatılır;
// istemci EventSource'u otomatik yeniden bağlar. Sunucudaki bağlantı sayısını sınırlar.
const SSE_MAX_LIFETIME_MS = 5 * 60 * 1000; // 5 dakika

// GET /api/notifications/stream — Server-Sent Events ile gerçek zamanlı bildirim
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let lastCheck = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      // Bağlantı kuruldu mesajı
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

      const send = (data: unknown) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          // bağlantı kapandı
        }
      };

      // 8s → 20s: 500 SSE bağlantısında DB yük 125 sorgu/sn → 50 sorgu/sn'ye düşer.
      // Her tick'te: yalnızca okunmamış mesaj sayısı (tek hafif sorgu).
      // Bildirimler: yalnızca yeni bildirim varsa gönderilir (ikinci sorgu, koşullu).
      const interval = setInterval(async () => {
        if (req.signal.aborted) {
          clearInterval(interval);
          return;
        }

        try {
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

          send({ type: "heartbeat", unreadMessages, ts: Date.now() });
          lastCheck = new Date();
        } catch (err) {
          log.error("SSE polling hatası", err);
        }
      }, 20000); // 8s → 20s

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
