import { NextRequest, NextResponse } from "next/server";
import { prismaRead } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import { createLogger } from "@/lib/logger";
import { z } from "zod";

const log = createLogger("api:comment");

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 dakika

// PATCH /api/comments/[id] — yorum düzenle (15 dk penceresi)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: commentId } = await params;

  const bodySchema = z.object({ content: z.string().min(1).max(500) });
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz içerik" }, { status: 400 });
  }

  const comment = await prismaRead.postComment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, createdAt: true, deletedAt: true },
  });

  if (!comment) return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
  if (comment.deletedAt) return NextResponse.json({ error: "Yorum silinmiş" }, { status: 410 });
  if (comment.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 15 dakika pencere kontrolü
  const ageMs = Date.now() - new Date(comment.createdAt).getTime();
  if (ageMs > EDIT_WINDOW_MS) {
    return NextResponse.json({ error: "Düzenleme süresi doldu (15 dk)" }, { status: 403 });
  }

  const updated = await prisma.postComment.update({
    where: { id: commentId },
    data: { content: parsed.data.content, updatedAt: new Date() },
    select: { id: true, content: true, updatedAt: true },
  });

  log.info("Yorum düzenlendi", { commentId, userId });
  return NextResponse.json({ success: true, comment: updated });
}

// DELETE /api/comments/[id] — soft delete (sahip veya post sahibi)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: commentId } = await params;

  const comment = await prismaRead.postComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      deletedAt: true,
      post: { select: { userId: true } },
    },
  });

  if (!comment) return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
  if (comment.deletedAt) return NextResponse.json({ success: true }); // idempotent

  const isOwner = comment.userId === userId;
  const isPostOwner = comment.post.userId === userId;
  if (!isOwner && !isPostOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft delete — içerik gizlenir, alt yanıtlar korunur
  await prisma.postComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  log.info("Yorum soft-silindi", { commentId, userId, byPostOwner: isPostOwner });
  return NextResponse.json({ success: true });
}
