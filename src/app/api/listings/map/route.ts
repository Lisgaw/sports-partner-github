import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Haritada gösterilecek ilanları döndürür (GPS koordinatı olan açık ilanlar)
export async function GET() {
  try {
    const now = new Date();
    const coordinateGrid = 0.0045;
    const anonymizeCoordinate = (value: number) => Math.round(value / coordinateGrid) * coordinateGrid;

    const rawListings = await prisma.listing.findMany({
      where: {
        status: "OPEN",
        latitude: { not: null },
        longitude: { not: null },
        dateTime: { gt: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      select: {
        id: true,
        description: true,
        type: true,
        latitude: true,
        longitude: true,
        sport: { select: { name: true, icon: true } },
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        district: {
          select: {
            name: true,
            city: { select: { name: true } },
          },
        },
        city: {
          select: {
            name: true,
            country: { select: { name: true } },
          },
        },
      },
      take: 500,
      orderBy: { createdAt: "desc" },
    });

    const listings = rawListings.map((listing) => ({
      ...listing,
      latitude: anonymizeCoordinate(Number(listing.latitude)),
      longitude: anonymizeCoordinate(Number(listing.longitude)),
    }));

    return NextResponse.json({ success: true, listings });
  } catch {
    return NextResponse.json({ success: false, listings: [] }, { status: 500 });
  }
}
