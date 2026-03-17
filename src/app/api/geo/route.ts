import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country") || "TR";

  return NextResponse.json(
    { country },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}