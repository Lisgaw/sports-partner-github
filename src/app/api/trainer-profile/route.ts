import { NextResponse } from "next/server";

// Trainer modülü kaldırıldı
export async function GET() {
  return NextResponse.json({ success: false, error: "Bu özellik artık mevcut değil" }, { status: 410 });
}
export async function PUT() {
  return NextResponse.json({ success: false, error: "Bu özellik artık mevcut değil" }, { status: 410 });
}
export async function DELETE() {
  return NextResponse.json({ success: false, error: "Bu özellik artık mevcut değil" }, { status: 410 });
}

