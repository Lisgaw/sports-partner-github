import { NextResponse } from "next/server";

export const EDGE_CACHE = {
  SHORT: "public, s-maxage=30, stale-while-revalidate=120",
  LISTINGS: "public, s-maxage=60, stale-while-revalidate=300",
  PRIVATE_FEED: "private, max-age=20, stale-while-revalidate=60",
} as const;

export function withCacheHeaders(
  response: NextResponse,
  cacheControl: string,
  vary = "Accept-Encoding"
): NextResponse {
  response.headers.set("Cache-Control", cacheControl);
  response.headers.set("Vary", vary);
  return response;
}
