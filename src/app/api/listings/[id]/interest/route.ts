import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import { cacheDel } from "@/lib/cache";
import { createNotification } from "@/lib/notifications";

// POST /api/listings/[id]/interest — toggle interest
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Giriş yapmanız gerekiyor" }, { status: 401 });
    }

    const { id: listingId } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, userId: true, sport: { select: { name: true } }, _count: { select: { interests: true } } },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: "İlan bulunamadı" }, { status: 404 });
    }

    // Cannot interest own listing
    if (listing.userId === userId) {
      return NextResponse.json({ success: false, error: "Kendi ilanınıza ilgi gösteremezsiniz" }, { status: 400 });
    }

    const existing = await prisma.listingInterest.findUnique({
      where: { listingId_userId: { listingId, userId } },
    });

    if (existing) {
      // Remove interest (toggle off)
      await prisma.listingInterest.delete({ where: { id: existing.id } });
      const newCount = listing._count.interests - 1;
      await cacheDel(`listing:${listingId}`);
      return NextResponse.json({ success: true, interested: false, count: newCount });
    } else {
      // Add interest
      await prisma.listingInterest.create({ data: { listingId, userId } });
      const newCount = listing._count.interests + 1;
      await cacheDel(`listing:${listingId}`);

      // Milestone notifications: 5, 10, 25, 50, 100
      const milestones = [5, 10, 25, 50, 100];
      if (milestones.includes(newCount)) {
        await createNotification({
          userId: listing.userId,
          type: "LISTING_INTEREST_MILESTONE",
          title: `İlanınıza ${newCount} kişi ilgi gösterdi`,
          body: `${listing.sport?.name ?? "Spor"} ilanınız ${newCount} ilgi aldı`,
          link: `/ilan/${listingId}`,
        });
      }

      return NextResponse.json({ success: true, interested: true, count: newCount });
    }
  } catch (error) {
    console.error("[ListingInterest]", error);
    return NextResponse.json({ success: false, error: "İşlem gerçekleştirilemedi" }, { status: 500 });
  }
}

// GET /api/listings/[id]/interest — check interest status for current user
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: true, interested: false, count: 0 });
    }

    const { id: listingId } = await params;

    const [existing, count] = await Promise.all([
      prisma.listingInterest.findUnique({
        where: { listingId_userId: { listingId, userId } },
        select: { id: true },
      }),
      prisma.listingInterest.count({ where: { listingId } }),
    ]);

    return NextResponse.json({ success: true, interested: !!existing, count });
  } catch (error) {
    console.error("[ListingInterest GET]", error);
    return NextResponse.json({ success: false, error: "İşlem gerçekleştirilemedi" }, { status: 500 });
  }
}
