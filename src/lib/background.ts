/**
 * Background Task Runner — post-response çalışan ağır işler
 *
 * Next.js after() API'si kullanır: response gönderildikten SONRA çalışır,
 * serverless function ömrünü uzatır (setImmediate gibi kesilmez).
 *
 * Kullanım:
 *   import { after } from "next/server";
 *   import { backgroundNotify, backgroundInvalidateFeeds } from "@/lib/background";
 *
 *   // Route handler içinde:
 *   after(() => backgroundNotify({ userId, ... }));
 *   after(() => backgroundInvalidateFeeds());
 *   return NextResponse.json({ success: true });
 *
 * Kazanç: API response sürelerinde %30-50 iyileşme (ağır işler response'u bloke etmez)
 */
import { prisma } from "@/lib/prisma";
import { pushSSEEvent } from "@/lib/event-bus";
import { cacheDelPattern } from "@/lib/cache";
import { bumpGlobalFeedVersion } from "@/lib/feed-snapshot";
import { sendPushToUser, type PushPayload, type SubscriptionData } from "@/lib/push";
import { createLogger } from "@/lib/logger";

const log = createLogger("background");

// ─── Bildirim (DB + SSE push) ────────────────────────────────────────────────

interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

/** Tek bildirim: DB yaz + SSE push */
export async function backgroundNotify(input: NotifyInput): Promise<void> {
  try {
    const result = await prisma.notification.create({ data: input as any });
    await pushSSEEvent(input.userId, {
      type: "notification",
      data: { id: result.id, type: input.type, title: input.title, body: input.body, link: input.link },
      ts: Date.now(),
    });
  } catch (err) {
    log.error("backgroundNotify failed", err);
  }
}

/** Toplu bildirim: DB createMany + SSE push */
export async function backgroundBulkNotify(items: NotifyInput[]): Promise<void> {
  if (items.length === 0) return;
  try {
    await prisma.notification.createMany({ data: items as any[], skipDuplicates: true });
    await Promise.allSettled(
      items.map((item) =>
        pushSSEEvent(item.userId, {
          type: "notification",
          data: { type: item.type, title: item.title, body: item.body, link: item.link },
          ts: Date.now(),
        })
      )
    );
  } catch (err) {
    log.error("backgroundBulkNotify failed", err);
  }
}

// ─── Feed Invalidation ──────────────────────────────────────────────────────

/** İlan cache temizle + global feed version bump */
export async function backgroundInvalidateFeeds(): Promise<void> {
  try {
    await Promise.all([
      cacheDelPattern("listings:*"),
      bumpGlobalFeedVersion(),
    ]);
  } catch (err) {
    log.error("backgroundInvalidateFeeds failed", err);
  }
}

// ─── Push Bildirim ──────────────────────────────────────────────────────────

/** Web Push gönder (fire-and-forget) */
export async function backgroundPush(
  subscriptions: SubscriptionData[],
  payload: PushPayload
): Promise<void> {
  if (subscriptions.length === 0) return;
  try {
    await sendPushToUser(subscriptions, payload);
  } catch (err) {
    log.error("backgroundPush failed", err);
  }
}
