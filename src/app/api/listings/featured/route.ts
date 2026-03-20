import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";
import { withBudget } from "@/lib/query-budget";

// GET /api/listings/featured — günün öne çıkan ilanları (en çok ilgi + kısa süre kalan)
export async function GET() {
  return withBudget("listings:featured", async () => {
    try {
      const featured = await withCache(
        "featured-listings",
        300, // 5 dakika
        async () => {
          const now = new Date();
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);

          // Son 24 saatte en çok ilgi gören, aktif, tarihi gelecekte olan ilanlar
          const listings = await prisma.listing.findMany({
            where: {
              status: "OPEN",
              dateTime: { gt: now },
            },
            orderBy: [
              { interests: { _count: "desc" } },
              { createdAt: "desc" },
            ],
            take: 6,
            select: {
              id: true,
              type: true,
              dateTime: true,
              city: { select: { id: true, name: true } },
              district: { select: { id: true, name: true } },
              sport: { select: { id: true, name: true, icon: true } },
              user: { select: { id: true, name: true, avatarUrl: true, isVerifiedUser: true } },
              _count: { select: { responses: true, interests: true } },
              maxParticipants: true,
              description: true,
            },
          });

          return listings;
        }
      );

      return NextResponse.json({ success: true, data: featured });
    } catch (error) {
      console.error("[FeaturedListings]", error);
      return NextResponse.json({ success: false, data: [] }, { status: 500 });
    }
  });
}
