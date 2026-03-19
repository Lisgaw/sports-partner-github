/**
 * Yük testi sırasında oluşturulan bot kullanıcıları, holistic bench kullanıcılarını
 * ve bu kullanıcılara ait tüm verileri (ilanlar, gönderiler, mesajlar vb.) temizler.
 *
 * Çalıştır:  npx tsx prisma/cleanup-test-data.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

const CHUNK = 500; // Büyük silme işlemlerini küçük parçalara böl (Supabase pool)

async function chunkDelete<T>(
  ids: string[],
  fn: (chunk: string[]) => Promise<{ count: number }>
): Promise<number> {
  let total = 0;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = ids.slice(i, i + CHUNK);
    const res = await fn(batch);
    total += res.count;
  }
  return total;
}

async function main() {
  console.log("🔍  Test kullanıcıları aranıyor...");

  // Bot factory kullanıcıları (isBot: true veya @botmail.com) +
  // Holistic bench kullanıcıları (sre.holistic+ prefix)
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { isBot: true },
        { email: { contains: "@botmail.com" } },
        { email: { startsWith: "sre.holistic" } },
      ],
    },
    select: { id: true, email: true },
  });

  const ids = testUsers.map((u) => u.id);
  console.log(`✅  Toplam ${ids.length} test kullanıcısı bulundu.`);
  if (ids.length === 0) {
    console.log("Temizlenecek veri yok.");
    return;
  }

  // ── 1. Mesajlar ──────────────────────────────────────────────────
  console.log("🗑  Mesajlar siliniyor...");
  const msgCount = await chunkDelete(ids, (batch) =>
    prisma.message.deleteMany({
      where: { OR: [{ senderId: { in: batch } }, { receiverId: { in: batch } }] },
    })
  );
  console.log(`   → ${msgCount} mesaj silindi`);

  // ── 2. Direkt Konuşmalar ─────────────────────────────────────────
  console.log("🗑  Direkt konuşmalar siliniyor...");
  const convCount = await chunkDelete(ids, (batch) =>
    prisma.directConversation.deleteMany({
      where: { OR: [{ user1Id: { in: batch } }, { user2Id: { in: batch } }] },
    })
  );
  console.log(`   → ${convCount} konuşma silindi`);

  // ── 3. Hikaye görüntülemeleri ────────────────────────────────────
  const svCount = await chunkDelete(ids, (batch) =>
    prisma.storyView.deleteMany({ where: { userId: { in: batch } } })
  );
  console.log(`   → ${svCount} hikaye görüntülemesi silindi`);

  // ── 4. Hikaye highlight öğeleri → Highlightlar → Hikayeler ───────
  // Önce bu kullanıcıların kendi hikayelerine ait highlight öğelerini temizle
  const storyIds = (
    await prisma.story.findMany({ where: { userId: { in: ids } }, select: { id: true } })
  ).map((s) => s.id);

  if (storyIds.length > 0) {
    await chunkDelete(storyIds, (batch) =>
      prisma.storyHighlightItem.deleteMany({ where: { storyId: { in: batch } } })
    );
  }

  // StoryHighlight: highlight'a ait storyItems silindi, şimdi highlightları sil
  const highlightCount = await chunkDelete(ids, (batch) =>
    prisma.storyHighlight.deleteMany({ where: { userId: { in: batch } } })
  );
  console.log(`   → ${highlightCount} hikaye highlight silindi`);

  // Story
  const storyCount = await chunkDelete(ids, (batch) =>
    prisma.story.deleteMany({ where: { userId: { in: batch } } })
  );
  console.log(`   → ${storyCount} hikaye silindi`);

  // ── 5. Post bağlantıları ─────────────────────────────────────────
  const clCount = await chunkDelete(ids, (batch) =>
    prisma.commentLike.deleteMany({ where: { userId: { in: batch } } })
  );
  const pcCount = await chunkDelete(ids, (batch) =>
    prisma.postComment.deleteMany({ where: { userId: { in: batch } } })
  );
  const plCount = await chunkDelete(ids, (batch) =>
    prisma.postLike.deleteMany({ where: { userId: { in: batch } } })
  );
  const postCount = await chunkDelete(ids, (batch) =>
    prisma.post.deleteMany({ where: { userId: { in: batch } } })
  );
  console.log(`   → ${postCount} gönderi, ${plCount} beğeni, ${pcCount} yorum, ${clCount} yorum beğenisi silindi`);

  // ── 6. Üyelikler ─────────────────────────────────────────────────
  await chunkDelete(ids, (batch) =>
    prisma.communityMembership.deleteMany({ where: { userId: { in: batch } } })
  );
  await chunkDelete(ids, (batch) =>
    prisma.tournamentParticipant.deleteMany({ where: { userId: { in: batch } } })
  );
  await chunkDelete(ids, (batch) =>
    prisma.groupMembership.deleteMany({ where: { userId: { in: batch } } })
  );
  await chunkDelete(ids, (batch) =>
    prisma.userClubMembership.deleteMany({ where: { userId: { in: batch } } })
  );
  console.log(`   → Topluluk/turnuva/grup/kulüp üyelikleri silindi`);

  // ── 7. Sosyal ilişkiler ───────────────────────────────────────────
  await chunkDelete(ids, (batch) =>
    prisma.favorite.deleteMany({ where: { userId: { in: batch } } })
  );
  await chunkDelete(ids, (batch) =>
    prisma.notification.deleteMany({ where: { userId: { in: batch } } })
  );
  await chunkDelete(ids, (batch) =>
    prisma.userReport.deleteMany({
      where: { OR: [{ reporterId: { in: batch } }, { reportedId: { in: batch } }] },
    })
  );
  await chunkDelete(ids, (batch) =>
    prisma.userBlock.deleteMany({
      where: { OR: [{ blockerId: { in: batch } }, { blockedId: { in: batch } }] },
    })
  );
  await chunkDelete(ids, (batch) =>
    prisma.follow.deleteMany({
      where: { OR: [{ followerId: { in: batch } }, { followingId: { in: batch } }] },
    })
  );
  await chunkDelete(ids, (batch) =>
    prisma.directChallenge.deleteMany({
      where: { OR: [{ challengerId: { in: batch } }, { targetId: { in: batch } }] },
    })
  );
  console.log(`   → Favori/bildirim/rapor/engel/takip/meydan okuma silindi`);

  // ── 8. Puanlamalar ────────────────────────────────────────────────
  await chunkDelete(ids, (batch) =>
    prisma.rating.deleteMany({
      where: { OR: [{ ratedById: { in: batch } }, { ratedUserId: { in: batch } }] },
    })
  );
  console.log(`   → Puanlamalar silindi`);

  // ── 9. Maçlar (önce sil, ardından response/listing silinebilir) ──
  const matchCount = await chunkDelete(ids, (batch) =>
    prisma.match.deleteMany({
      where: { OR: [{ user1Id: { in: batch } }, { user2Id: { in: batch } }] },
    })
  );
  console.log(`   → ${matchCount} maç silindi`);

  // ── 10. İlan başvuruları ─────────────────────────────────────────
  // Bu kullanıcıların kendi başvuruları + bu kullanıcıların ilanlarına yapılan başvurular
  const testListingIds = (
    await prisma.listing.findMany({ where: { userId: { in: ids } }, select: { id: true } })
  ).map((l) => l.id);

  if (testListingIds.length > 0) {
    await chunkDelete(testListingIds, (batch) =>
      prisma.response.deleteMany({ where: { listingId: { in: batch } } })
    );
  }
  await chunkDelete(ids, (batch) =>
    prisma.response.deleteMany({ where: { userId: { in: batch } } })
  );
  console.log(`   → Başvurular silindi`);

  // ── 11. NoShow raporları ─────────────────────────────────────────
  await chunkDelete(ids, (batch) =>
    prisma.noShowReport.deleteMany({
      where: { OR: [{ reporterId: { in: batch } }, { reportedId: { in: batch } }] },
    })
  );

  // ── 12. Profil verileri ──────────────────────────────────────────
  // PushSubscription — onDelete:Cascade var ama önceden silmek zararsız
  try {
    await chunkDelete(ids, (batch) =>
      prisma.pushSubscription.deleteMany({ where: { userId: { in: batch } } })
    );
  } catch { /* Cascade varsa zaten silinecek */ }

  // TrainerEnrollment: trainerId + studentId (userId değil)
  await chunkDelete(ids, (batch) =>
    prisma.trainerEnrollment.deleteMany({
      where: { OR: [{ trainerId: { in: batch } }, { studentId: { in: batch } }] },
    })
  );

  // BotTask: listingBotId + responderBotId
  try {
    await chunkDelete(ids, (batch) =>
      prisma.botTask.deleteMany({
        where: { OR: [{ listingBotId: { in: batch } }, { responderBotId: { in: batch } }] },
      })
    );
  } catch { /* opsiyonel */ }

  // TrainerProfile (varsa bağlı TrainerSpecialization önce silinmeli)
  const trainerProfileIds = (
    await prisma.trainerProfile.findMany({ where: { userId: { in: ids } }, select: { id: true } })
  ).map((t) => t.id);
  if (trainerProfileIds.length > 0) {
    await chunkDelete(trainerProfileIds, (batch) =>
      prisma.trainerSpecialization.deleteMany({ where: { profileId: { in: batch } } })
    );
  }
  await chunkDelete(ids, (batch) =>
    prisma.trainerProfile.deleteMany({ where: { userId: { in: batch } } })
  );

  // VenueProfile
  await chunkDelete(ids, (batch) =>
    prisma.venueProfile.deleteMany({ where: { userId: { in: batch } } })
  );

  // ── 13. İlanlar ──────────────────────────────────────────────────
  // Holistic-write açıklamalı ilanları da temizle (başka bot olmayan kullanıcılar oluşturmuşsa)
  const descriptionCleanup = await prisma.listing.deleteMany({
    where: { description: { contains: "[holistic-write]" } },
  });
  const listingCount = await chunkDelete(ids, (batch) =>
    prisma.listing.deleteMany({ where: { userId: { in: batch } } })
  );
  console.log(`   → ${listingCount + descriptionCleanup.count} ilan silindi`);

  // ── 14. PasswordResetToken — email alanı ile ilişkilendirilmiş ──────
  const testEmails = testUsers.map((u) => u.email);
  await chunkDelete(testEmails, (batch) =>
    prisma.passwordResetToken.deleteMany({ where: { email: { in: batch } } })
  );

  // ── 15. BotTask ──────────────────────────────────────────────────
  try {
    await chunkDelete(ids, (batch) =>
      (prisma as any).botTask.deleteMany({ where: { userId: { in: batch } } })
    );
  } catch { /* opsiyonel */ }

  // ── 16. Kullanıcılar ─────────────────────────────────────────────
  console.log("🗑  Kullanıcılar siliniyor...");
  const userCount = await chunkDelete(ids, (batch) =>
    prisma.user.deleteMany({ where: { id: { in: batch } } })
  );
  console.log(`✅  ${userCount} test kullanıcısı silindi.`);

  // ── 17. Orphan holistic-message mesajlarını da temizle ────────────
  const orphanMsg = await prisma.message.deleteMany({
    where: { content: { contains: "[holistic-message]" } },
  });
  if (orphanMsg.count > 0) console.log(`   → ${orphanMsg.count} orphan holistic mesajı silindi`);

  console.log("\n🎉  Temizlik tamamlandı.");
}

main()
  .catch((e) => {
    console.error("❌  Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
