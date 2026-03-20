import { NextResponse } from "next/server";

// Trainer modul kaldirild i
export async function GET() {
  return NextResponse.json({ success: false, error: "Bu ozellik kaldirildi" }, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, error: "Bu ozellik kaldirildi" }, { status: 410 });
}
