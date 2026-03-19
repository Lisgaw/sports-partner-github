import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId, unauthorized } from "@/lib/api-utils";
import { createLogger } from "@/lib/logger";
import { EDGE_CACHE, withCacheHeaders } from "@/lib/http-cache";
import { getFeedPayload, getStaleFeedPayload } from "@/lib/feed-snapshot";

const log = createLogger("feed");

// GET /api/feed — Takip edilenlerin + kendi spor/şehir ilanları
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const result = await getFeedPayload(userId, page);
    if (!result) return unauthorized();

    const response = NextResponse.json(result.payload);
    response.headers.set("X-Data-Source", result.source);
    return withCacheHeaders(response, EDGE_CACHE.PRIVATE_FEED, "Accept-Encoding, Cookie");
  } catch (error) {
    log.error("Feed hatası", error);
    try {
      const userId = await getCurrentUserId();
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, Number(searchParams.get("page") ?? 1));
      if (userId) {
        const stale = await getStaleFeedPayload(userId, page);
        if (stale) {
          const response = NextResponse.json({ ...stale, stale: true }, { status: 200 });
          response.headers.set("X-Data-Source", "stale-snapshot");
          return withCacheHeaders(response, EDGE_CACHE.PRIVATE_FEED, "Accept-Encoding, Cookie");
        }
      }
    } catch {
      // fallback response below
    }

    return NextResponse.json({ success: false, error: "Feed yüklenemedi" }, { status: 500 });
  }
}
