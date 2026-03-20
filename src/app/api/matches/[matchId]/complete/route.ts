import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";
import { createLogger } from "@/lib/logger";

const log = createLogger("match-complete");

// POST /api/matches/[matchId]/complete — Kullanıcı maçı oynadı olarak onaylar
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId)
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });

    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: { select: { id: true, sport: { select: { name: true, icon: true } } } },
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
      },
    });

    if (!match)
      return NextResponse.json({ error: "Maç bulunamadı" }, { status: 404 });

    if (match.status === "COMPLETED")
      return NextResponse.json({ success: true, completed: true, data: match });

    const isU1 = match.user1Id === userId;
    const isU2 = match.user2Id === userId;

    if (!isU1 && !isU2)
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });

    // Zaten onayladıysa
    const alreadyApproved = (isU1 && match.u1Approved) || (isU2 && match.u2Approved);
    if (alreadyApproved)
      return NextResponse.json({ success: true, pendingConfirmation: true, data: match });

    const updateData: Record<string, unknown> = isU1
      ? { u1Approved: true }
      : { u2Approved: true };

    const otherApproved = isU1 ? match.u2Approved : match.u1Approved;
    const bothApproved = otherApproved; // diğer kullanıcı zaten onaylamışsa şimdi ikisi de onayladı

    if (bothApproved) {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: updateData as any,
    });

    const sportLabel = match.listing?.sport
      ? `${match.listing.sport.icon ?? ""} ${match.listing.sport.name}`
      : "Maç";

    if (bothApproved) {
      // Her iki taraf onayladı → her ikisine tamamlandı bildirimi
      await Promise.allSettled([
        createNotification({
          userId: match.user1Id,
          type: "MATCH_STATUS_CHANGED",
          title: "Maç Tamamlandı 🎉",
          body: `${sportLabel} maçı her iki tarafça onaylandı. Şimdi değerlendirme yapabilirsiniz!`,
          link: `/eslesmeler/${matchId}`,
        }),
        createNotification({
          userId: match.user2Id,
          type: "MATCH_STATUS_CHANGED",
          title: "Maç Tamamlandı 🎉",
          body: `${sportLabel} maçı her iki tarafça onaylandı. Şimdi değerlendirme yapabilirsiniz!`,
          link: `/eslesmeler/${matchId}`,
        }),
      ]);

      return NextResponse.json({ success: true, completed: true, data: updated });
    } else {
      // Sadece biri onayladı → diğerine bildirim gönder
      const me = isU1 ? match.user1 : match.user2;
      const otherId = isU1 ? match.user2Id : match.user1Id;

      await createNotification({
        userId: otherId,
        type: "MATCH_STATUS_CHANGED",
        title: "Maçı Oynadınız mı? ⚽",
        body: `${me.name} ${sportLabel} maçını oynadığını onayladı. Siz de onayladınız mı? Buraya tıklayarak belirtebilirsiniz.`,
        link: `/eslesmeler/${matchId}`,
      });

      return NextResponse.json({ success: true, pendingConfirmation: true, data: updated });
    }
  } catch (err) {
    log.error("Match complete hatası", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
