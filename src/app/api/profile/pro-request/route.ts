import { NextResponse } from "next/server";

// Trainer modülü kaldırıldı
export async function POST() {
  return NextResponse.json({ success: false, error: "Bu özellik artık mevcut değil" }, { status: 410 });
}
