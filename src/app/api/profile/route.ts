import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/api-utils";
import { updateProfileSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { withCache, cacheDel, cacheKey, CACHE_TTL } from "@/lib/cache";
import { bumpUserFeedVersion, warmFeedSnapshot } from "@/lib/feed-snapshot";
import { withBudget } from "@/lib/query-budget";

const log = createLogger("profile");

// Mevcut kullanıcının profil bilgileri
export async function GET() {
  return withBudget("profile:GET", async () => {
    try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    const profileData = await withCache(cacheKey.profile(userId), CACHE_TTL.PROFILE, async () => {
    const [user, myListings, myResponses, myMatches, myFavorites, unreadNotifications, followersCount, followingCount, myClubs, myGroups] = await Promise.all([
      // findUnique kullan: GET handler'da yazma işlemi OLMAZ — lastSeenAt fire-and-forget ile güncellenir
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, phone: true, createdAt: true,
          bio: true, avatarUrl: true, coverUrl: true,
          gender: true,
          birthDate: true,
          noShowCount: true,
          warnCount: true,
          isBanned: true,
          preferredTime: true,
          preferredStyle: true,
          onboardingDone: true,
          userType: true,
          userLevel: true,
          lastSeenAt: true,
          currentStreak: true,
          longestStreak: true,
          totalMatches: true,
          totalPoints: true,
          lastActiveDate: true,
          cityId: true,
          districtId: true,
          city: { select: { id: true, name: true, country: { select: { id: true, name: true } } } },
          district: { select: { id: true, name: true } },
          sports: { select: { id: true, name: true, icon: true } },
          ratingsReceived: { select: { score: true } },
          ratingsGiven: { select: { matchId: true } },
          instagram: true,
          tiktok: true,
          facebook: true,
          twitterX: true,
          telegram: true,
          whatsapp: true,
          youtube: true,
          linkedin: true,
          discord: true,
          twitch: true,
          snapchat: true,
          litmatch: true,
          socialLinksVisibility: true,
          instagramVisibility: true,
          tiktokVisibility: true,
          facebookVisibility: true,
          twitterXVisibility: true,
          telegramVisibility: true,
          whatsappVisibility: true,
          youtubeVisibility: true,
          linkedinVisibility: true,
          discordVisibility: true,
          twitchVisibility: true,
          snapchatVisibility: true,
          litmatchVisibility: true,
          isVerifiedUser: true,
          _count: {
            select: {
              followers: true,
              following: true,
            }
          }
        },
      }),
      prisma.listing.findMany({
        where: { userId },
        include: {
          sport: true,
          district: { include: { city: true } },
          venue: true,
          responses: {
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          match: {
            include: {
              user2: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.response.findMany({
        where: { userId },
        include: {
          listing: {
            include: {
              sport: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.match.findMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        include: {
          listing: { include: { sport: true, venue: true } },
          user1: { select: { id: true, name: true, avatarUrl: true } },
          user2: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Favoriler
      prisma.favorite.findMany({
        where: { userId },
        include: {
          listing: {
            include: {
              sport: true,
              district: { include: { city: true } },
              user: { select: { id: true, name: true } },
              _count: { select: { responses: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Okunmamış bildirim sayısı
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.follow.count({ where: { followingId: userId, status: "ACCEPTED" } }),
      prisma.follow.count({ where: { followerId: userId, status: "ACCEPTED" } }),
      // Kulüp üyelikleri
      prisma.userClubMembership.findMany({
        where: { userId },
        include: {
          club: {
            select: {
              id: true, name: true, description: true, website: true,
              sport: { select: { id: true, name: true, icon: true } },
              city: { select: { id: true, name: true } },
              _count: { select: { members: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        take: 20,
      }),
      // Grup üyelikleri
      prisma.groupMembership.findMany({
        where: { userId },
        include: {
          group: {
            select: {
              id: true, name: true, description: true, isPublic: true,
              sport: { select: { id: true, name: true, icon: true } },
              city: { select: { id: true, name: true } },
              _count: { select: { members: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        take: 20,
      }),
    ]);

    if (!user) return null;

    const avgRating = (user as any).ratingsReceived?.length > 0
      ? Math.round(((user as any).ratingsReceived.reduce((s: number, r: { score: number }) => s + r.score, 0) / (user as any).ratingsReceived.length) * 10) / 10
      : null;
    const ratedMatchIds = new Set(((user as any).ratingsGiven ?? []).map((r: { matchId: string }) => r.matchId));

    return {
      user: {
        ...user,
        _count: {
          ...(user as any)._count,
          followers: followersCount,
          following: followingCount,
        },
        avgRating,
        ratingCount: (user as any).ratingsReceived?.length ?? 0,
      },
      ratedMatchIds: Array.from(ratedMatchIds),
      myListings,
      myResponses,
      myMatches,
      myFavorites: myFavorites.map((f) => f.listing),
      myClubs,
      myGroups,
      unreadNotifications,
    };
    }); // withCache end

    if (!profileData) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // lastSeenAt: her istekte güncelle — cache'in dışında
    setImmediate(() => {
      prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
        .catch(() => { /* sessizce görmezden gel */ });
    });

    return NextResponse.json({ success: true, data: profileData });
  } catch (error) {
    log.error("Profil yüklenirken hata", error);
    return NextResponse.json(
      { success: false, error: "Profil yüklenemedi" },
      { status: 500 }
    );
  }
  }); // withBudget end
}

// Profil güncelle
export async function PUT(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const userBefore = await prisma.user.findUnique({ where: { id: userId } });
    let hasAnyChanges = false;

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone;
    }
    if ("bio" in parsed.data && parsed.data.bio !== undefined) {
      updateData.bio = parsed.data.bio;
    }
    if ("cityId" in parsed.data && parsed.data.cityId !== undefined) {
      updateData.cityId = parsed.data.cityId || null;
    }
    if ("districtId" in parsed.data && parsed.data.districtId !== undefined) {
      updateData.districtId = parsed.data.districtId || null;
    }
    if ("avatarUrl" in parsed.data && parsed.data.avatarUrl !== undefined) {
      updateData.avatarUrl = parsed.data.avatarUrl;
    }
    if ("coverUrl" in parsed.data && parsed.data.coverUrl !== undefined) {
      updateData.coverUrl = parsed.data.coverUrl;
    }
    if ("gender" in parsed.data && parsed.data.gender !== undefined) {
      updateData.gender = parsed.data.gender;
    }
    if ("birthDate" in parsed.data && parsed.data.birthDate !== undefined) {
      updateData.birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
    }
    if ("preferredTime" in parsed.data && parsed.data.preferredTime !== undefined) {
      updateData.preferredTime = parsed.data.preferredTime;
    }
    if ("preferredStyle" in parsed.data && parsed.data.preferredStyle !== undefined) {
      updateData.preferredStyle = parsed.data.preferredStyle;
    }
    if ("onboardingDone" in parsed.data && parsed.data.onboardingDone !== undefined) {
      updateData.onboardingDone = parsed.data.onboardingDone;
    }
    if ("instagram" in parsed.data) updateData.instagram = parsed.data.instagram ?? null;
    if ("tiktok" in parsed.data) updateData.tiktok = parsed.data.tiktok ?? null;
    if ("facebook" in parsed.data) updateData.facebook = parsed.data.facebook ?? null;
    if ("twitterX" in parsed.data) updateData.twitterX = parsed.data.twitterX ?? null;
    if ("telegram" in parsed.data) updateData.telegram = parsed.data.telegram ?? null;
    if ("whatsapp" in parsed.data) updateData.whatsapp = parsed.data.whatsapp ?? null;
    if ("youtube" in parsed.data) updateData.youtube = parsed.data.youtube ?? null;
    if ("linkedin" in parsed.data) updateData.linkedin = parsed.data.linkedin ?? null;
    if ("discord" in parsed.data) updateData.discord = parsed.data.discord ?? null;
    if ("twitch" in parsed.data) updateData.twitch = parsed.data.twitch ?? null;
    if ("snapchat" in parsed.data) updateData.snapchat = parsed.data.snapchat ?? null;
    if ("litmatch" in parsed.data) updateData.litmatch = parsed.data.litmatch ?? null;
    if ("socialLinksVisibility" in parsed.data && parsed.data.socialLinksVisibility !== undefined) {
      updateData.socialLinksVisibility = parsed.data.socialLinksVisibility;
    }
    if ("instagramVisibility" in parsed.data && parsed.data.instagramVisibility !== undefined) {
      updateData.instagramVisibility = parsed.data.instagramVisibility;
    }
    if ("tiktokVisibility" in parsed.data && parsed.data.tiktokVisibility !== undefined) {
      updateData.tiktokVisibility = parsed.data.tiktokVisibility;
    }
    if ("facebookVisibility" in parsed.data && parsed.data.facebookVisibility !== undefined) {
      updateData.facebookVisibility = parsed.data.facebookVisibility;
    }
    if ("twitterXVisibility" in parsed.data && parsed.data.twitterXVisibility !== undefined) {
      updateData.twitterXVisibility = parsed.data.twitterXVisibility;
    }
    if ("telegramVisibility" in parsed.data && parsed.data.telegramVisibility !== undefined) {
      updateData.telegramVisibility = parsed.data.telegramVisibility;
    }
    if ("whatsappVisibility" in parsed.data && parsed.data.whatsappVisibility !== undefined) {
      updateData.whatsappVisibility = parsed.data.whatsappVisibility;
    }
    if ("youtubeVisibility" in parsed.data && parsed.data.youtubeVisibility !== undefined) {
      updateData.youtubeVisibility = parsed.data.youtubeVisibility;
    }
    if ("linkedinVisibility" in parsed.data && parsed.data.linkedinVisibility !== undefined) {
      updateData.linkedinVisibility = parsed.data.linkedinVisibility;
    }
    if ("discordVisibility" in parsed.data && parsed.data.discordVisibility !== undefined) {
      updateData.discordVisibility = parsed.data.discordVisibility;
    }
    if ("twitchVisibility" in parsed.data && parsed.data.twitchVisibility !== undefined) {
      updateData.twitchVisibility = parsed.data.twitchVisibility;
    }
    if ("snapchatVisibility" in parsed.data && parsed.data.snapchatVisibility !== undefined) {
      updateData.snapchatVisibility = parsed.data.snapchatVisibility;
    }
    if ("litmatchVisibility" in parsed.data && parsed.data.litmatchVisibility !== undefined) {
      updateData.litmatchVisibility = parsed.data.litmatchVisibility;
    }
    if ("vk" in parsed.data) updateData.vk = parsed.data.vk ?? null;
    if ("vkVisibility" in parsed.data && parsed.data.vkVisibility !== undefined) {
      updateData.vkVisibility = parsed.data.vkVisibility;
    }

    // Favori sporlar güncelleme
    const sportIds = "sportIds" in parsed.data ? (parsed.data as { sportIds?: string[] }).sportIds : undefined;
    if (sportIds !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { sports: { set: sportIds.map((id) => ({ id })) } },
      });
      hasAnyChanges = true;
    }

    // Şifre değiştirme
    if (parsed.data.newPassword && parsed.data.currentPassword) {
      // Rate limit for password change attempts
      const rateCheck = await checkRateLimit(userId, "auth");
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { success: false, error: "Çok fazla deneme. Lütfen bekleyin." },
          { status: 429 }
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Kullanıcı bulunamadı" },
          { status: 404 }
        );
      }

      const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash ?? "");
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Mevcut şifre hatalı" },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    }

    // Auto-verify: 3+ sosyal link varsa isVerifiedUser = true
    const socialFields = ["instagram", "tiktok", "facebook", "twitterX", "telegram", "whatsapp", "youtube", "linkedin", "discord", "twitch", "snapchat", "litmatch", "vk"] as const;
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: Object.fromEntries(socialFields.map((f) => [f, true])) as Record<string, true> });
    const mergedSocials = { ...currentUser, ...Object.fromEntries(socialFields.filter((f) => f in updateData).map((f) => [f, updateData[f]])) };
    const filledCount = socialFields.filter((f) => !!(mergedSocials as Record<string, unknown>)[f]).length;
    updateData.isVerifiedUser = filledCount >= 3;

    const hasUserChanges = Object.keys(updateData).length > 0;
    hasAnyChanges = hasAnyChanges || hasUserChanges;

    if (!hasAnyChanges) {
      return NextResponse.json(
        { success: false, error: "Güncellenecek bir alan bulunamadı" },
        { status: 400 }
      );
    }

    const updated = hasUserChanges
      ? await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true, name: true, email: true, phone: true,
            bio: true, avatarUrl: true, coverUrl: true,
            city: { select: { id: true, name: true } },
            sports: { select: { id: true, name: true, icon: true } },
          },
        })
      : await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true, name: true, email: true, phone: true,
            bio: true, avatarUrl: true, coverUrl: true,
            city: { select: { id: true, name: true } },
            sports: { select: { id: true, name: true, icon: true } },
          },
        });

    // Profil cache'ini temizle (hem profil sayfası hem listings viewer profil cache'i)
    await Promise.all([
      cacheDel(cacheKey.profile(userId)),
      cacheDel(`viewer-profile:${userId}`),
      cacheDel(`aktivitelerim:${userId}`),
    ]);

    const feedSignalsChanged =
      sportIds !== undefined ||
      parsed.data.cityId !== undefined ||
      parsed.data.districtId !== undefined;

    if (feedSignalsChanged) {
      await bumpUserFeedVersion(userId);
      void warmFeedSnapshot(userId);
    }

    log.info("Profil güncellendi", { userId });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    log.error("Profil güncellenirken hata", error);
    return NextResponse.json(
      { success: false, error: "Profil güncellenemedi" },
      { status: 500 }
    );
  }
}

// ─── Hesap Silme (KVKK) ─────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body as { password?: string };

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Şifrenizi giriniz" },
        { status: 400 }
      );
    }

    // Rate limit
    const rateCheck = await checkRateLimit(userId, "auth");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Çok fazla deneme. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash ?? "");
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Şifre hatalı" },
        { status: 400 }
      );
    }

    // İlişkili verileri sil, sonra kullanıcıyı anonimleştir
    await prisma.$transaction(async (tx) => {
      // Sosyal içerikler
      await tx.postLike.deleteMany({ where: { userId } });
      await tx.commentLike.deleteMany({ where: { userId } });
      await tx.postComment.deleteMany({ where: { userId } });
      await tx.post.deleteMany({ where: { userId } });
      await tx.storyView.deleteMany({ where: { userId } });
      await tx.story.deleteMany({ where: { userId } });
      await tx.storyHighlight.deleteMany({ where: { userId } });

      // Bildirimler, favoriler, takipler
      await tx.notification.deleteMany({ where: { userId } });
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });

      // Mesajlar
      await tx.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
      await tx.directConversation.deleteMany({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } });

      // Grup/Kulüp/Topluluk üyelikleri
      await tx.groupMembership.deleteMany({ where: { userId } });
      await tx.userClubMembership.deleteMany({ where: { userId } });
      await tx.communityMembership.deleteMany({ where: { userId } });

      // Eski yarışma kayıtları
      await tx.tournamentParticipant.deleteMany({ where: { userId } });

      // Push abonelikleri
      await tx.pushSubscription.deleteMany({ where: { userId } });

      // Şifre sıfırlama tokenları
      await tx.passwordResetToken.deleteMany({ where: { email: user.email } });

      // Blok/Rapor
      await tx.userBlock.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
      await tx.userReport.deleteMany({ where: { OR: [{ reporterId: userId }, { reportedId: userId }] } });

      // NoShow raporları
      await tx.noShowReport.deleteMany({ where: { OR: [{ reporterId: userId }, { reportedId: userId }] } });

      // İlanlar: yanıtları, eşleşmeleri, puanları, ardından ilanları sil
      const listingIds = (await tx.listing.findMany({ where: { userId }, select: { id: true } })).map(l => l.id);
      if (listingIds.length > 0) {
        await tx.rating.deleteMany({ where: { match: { listingId: { in: listingIds } } } });
        await tx.match.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.response.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.listing.deleteMany({ where: { userId } });
      }

      // Kalan yanıtlar (başkalarının ilanlarına verdiği)
      await tx.response.deleteMany({ where: { userId } });

      // Kalan puanlar (verdiği/aldığı)
      await tx.rating.deleteMany({ where: { OR: [{ ratedById: userId }, { ratedUserId: userId }] } });

      // Direct challenges
      await tx.directChallenge.deleteMany({ where: { OR: [{ challengerId: userId }, { targetId: userId }] } });

      // Spor ilişkisini kes
      await tx.user.update({
        where: { id: userId },
        data: { sports: { set: [] } },
      });

      // Kullanıcıyı anonimleştir (KVKK: kişisel veri silinir, kayıt kalır)
      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Silinmiş Kullanıcı",
          email: `deleted_${userId}@removed.local`,
          passwordHash: null,
          phone: null,
          avatarUrl: null,
          coverUrl: null,
          bio: null,
          gender: null,
          birthDate: null,
          instagram: null,
          tiktok: null,
          facebook: null,
          twitterX: null,
          telegram: null,
          whatsapp: null,
          isBanned: true, // Giriş yapılamasın
          cityId: null,
          districtId: null,
        },
      });
    });

    // Cache temizle
    await cacheDel(cacheKey.profile(userId));

    log.info("Hesap silindi (anonimleştirildi)", { userId });

    return NextResponse.json({ success: true, message: "Hesabınız başarıyla silindi." });
  } catch (error) {
    log.error("Hesap silinirken hata", error);
    return NextResponse.json(
      { success: false, error: "Hesap silinemedi" },
      { status: 500 }
    );
  }
}
