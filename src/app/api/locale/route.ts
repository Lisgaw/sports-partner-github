import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = new Set(["tr", "en", "ru", "de", "fr", "es", "ja", "ko"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as { locale?: string }));
  const requested = typeof body.locale === "string" ? body.locale.toLowerCase() : "tr";
  const locale = SUPPORTED_LOCALES.has(requested) ? requested : "tr";

  const response = NextResponse.json({ success: true, locale });

  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
