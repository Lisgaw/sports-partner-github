import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import { createLogger } from "@/lib/logger";

const log = createLogger("user-followers");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUserId = await getCurrentUserId();

    // Private profile check: only the owner or accepted followers can see the list
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPrivateProfile: true },
    });
    if (user?.isPrivateProfile && currentUserId !== userId) {
      const isFollowing = currentUserId
        ? await prisma.follow.findFirst({
            where: { followerId: currentUserId, followingId: userId, status: "ACCEPTED" },
          })
        : null;
      if (!isFollowing) {
        return NextResponse.json({ success: true, data: [] });
      }
    }
    
    const followers = await prisma.follow.findMany({
      where: { 
        followingId: userId,
        status: "ACCEPTED"
      },
      select: {
        follower: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            city: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      success: true,
      data: followers.map(f => f.follower)
    });
  } catch (err) {
    log.error("Takipçi listesi hatası", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
