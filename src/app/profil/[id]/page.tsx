"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, differenceInYears } from "date-fns";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import toast from "@/lib/toast";
import { getPublicProfile, submitRating, getUserRatings, toggleFollow, getFollowStats, getLeaderboard, startDirectConversation, removeFollower } from "@/services/api";
import { APIError } from "@/services/api";
import type { PublicProfile, Rating, Badge } from "@/types";
import { LEVEL_LABELS, LEVEL_COLORS } from "@/types";
import BadgeComp from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PostCard from "@/components/profile/PostCard";
import SocialLinksRow from "@/components/social/SocialLinksRow";
import { getDateFnsLocale, localizeListingType, localizeSportName, resolveAppLocale } from "@/lib/localized-ui";

const PUBLIC_PROFILE_COPY = {
  tr: {
    loadFailed: "Profil yüklenemedi",
    profileUnavailableTitle: "Bu profili görüntüleme izniniz yok",
    profileUnavailableSubtitle: "Bu kullanıcı profilini gizlemiş veya sizi engellemiş olabilir.",
    notFound: "Kullanıcı bulunamadı",
    signInToFollow: "Takip etmek için giriş yapın",
    followRequestSent: "⏳ İstek Gönderildi",
    following: "Takip Ediliyor",
    follow: "Takip Et",
    message: "Mesaj Gönder",
    challenge: "Teklif Gönder",
    rate: "Değerlendir",
    removeFollower: "Takipçiyi Çıkar",
    restrict: "Kısıtla",
    unrestrict: "Kısıtlamayı Kaldır",
    block: "Engelle",
    unblock: "Engeli Kaldır",
    report: "Şikayet Et",
    blocked: "Engellendi",
    followsYou: "Seni takip ediyor",
    dayStreak: "gün seri",
    memberSince: "tarihinden beri üye",
    postsTab: "Gönderiler",
    listingsTab: "İlanlar",
    ratingsTab: "Değerlendirmeler",
    statsTab: "İstatistikler",
    hiddenTitle: "Bu Profil Gizli",
    hiddenDesc: "Paylaşımları ve detayları görmek için bu kullanıcıyı takip etmelisin.",
    signInAndFollow: "Giriş Yap ve Takip Et",
    noActiveListings: "Aktif ilan yok",
    noRatings: "Henüz değerlendirme yok",
    statsLoadFailed: "İstatistikler yüklenemedi",
    totalMatches: "Toplam Maç",
    completedMatches: "Tamamlanan",
    currentStreak: "Günlük Seri",
    longestStreak: "Rekor Seri",
    ratingsCount: "değerlendirme",
    bySport: "Spora Göre Maçlar",
    monthlyActivity: "Son 12 Ay Aktivitesi",
    matches: "maç",
    followers: "takipçi",
    followingCountLabel: "takip",
    editProfile: "Düzenle",
    yearsOld: "yaşında",
    noPosts: "Henüz gönderi yok",
    responses: "yanıt",
    loading: "Yükleniyor...",
    noOneYet: "Henüz kimse yok",
    unknownCity: "Bilinmeyen Şehir",
    reportReceived: "Şikayetiniz alındı, incelenecek.",
    reportSendFailed: "Şikayet gönderilemedi",
    genericError: "Bir hata oluştu",
    conversationStartFailed: "Konuşma başlatılamadı",
    signIn: "Giriş yapın",
    followRequestWithdrawn: "Takip isteği geri çekildi",
    followStarted: "✓ Takip edildi",
    followStopped: "Takipten çıkıldı",
    cancel: "İptal",
    send: "Gönder",
    challengeModalTitle: "Maç / Partner Teklifi",
    sportLabel: "Spor Dalı",
    chooseSportLabel: "Spor Dalı Seçin",
    challengeTypeLabel: "Teklif Türü",
    challengeDateLabel: "Önerilen Tarih/Saat (opsiyonel)",
    challengeMessageLabel: "Mesaj (opsiyonel)",
    challengeMessagePlaceholder: "Kısa bir mesaj ekleyin...",
    rivalLabel: "Rakip",
    partnerLabel: "Partner",
    rateModalTitle: "Kullanıcıyı Değerlendir",
    ratingLabel: "Puan",
    ratingCommentLabel: "Yorum (opsiyonel)",
    ratingCommentPlaceholder: "Bu kullanıcı hakkında ne düşünüyorsunuz?",
  },
  en: {
    loadFailed: "Profile could not be loaded",
    profileUnavailableTitle: "You cannot view this profile",
    profileUnavailableSubtitle: "This user may have hidden their profile or blocked you.",
    notFound: "User not found",
    signInToFollow: "Sign in to follow",
    followRequestSent: "⏳ Request sent",
    following: "Following",
    follow: "Follow",
    message: "Send Message",
    challenge: "Send Challenge",
    rate: "Rate",
    removeFollower: "Remove Follower",
    restrict: "Restrict",
    unrestrict: "Remove Restriction",
    block: "Block",
    unblock: "Unblock",
    report: "Report",
    blocked: "Blocked",
    followsYou: "Follows you",
    dayStreak: "day streak",
    memberSince: "member since",
    postsTab: "Posts",
    listingsTab: "Listings",
    ratingsTab: "Ratings",
    statsTab: "Stats",
    hiddenTitle: "This Profile Is Private",
    hiddenDesc: "You need to follow this user to see their posts and details.",
    signInAndFollow: "Sign In and Follow",
    noActiveListings: "No active listings",
    noRatings: "No ratings yet",
    statsLoadFailed: "Stats could not be loaded",
    totalMatches: "Total Matches",
    completedMatches: "Completed",
    currentStreak: "Current Streak",
    longestStreak: "Best Streak",
    ratingsCount: "ratings",
    bySport: "Matches by Sport",
    monthlyActivity: "Last 12 Months",
    matches: "matches",
    followers: "followers",
    followingCountLabel: "following",
    editProfile: "Edit",
    yearsOld: "years old",
    noPosts: "No posts yet",
    responses: "responses",
    loading: "Loading...",
    noOneYet: "Nobody yet",
    unknownCity: "Unknown City",
    reportReceived: "Your report has been received and will be reviewed.",
    reportSendFailed: "Report could not be sent",
    genericError: "Something went wrong",
    conversationStartFailed: "Conversation could not be started",
    signIn: "Sign in",
    followRequestWithdrawn: "Follow request withdrawn",
    followStarted: "✓ Followed",
    followStopped: "Unfollowed",
    cancel: "Cancel",
    send: "Send",
    challengeModalTitle: "Match / Partner Challenge",
    sportLabel: "Sport",
    chooseSportLabel: "Choose a sport",
    challengeTypeLabel: "Challenge Type",
    challengeDateLabel: "Suggested Date/Time (optional)",
    challengeMessageLabel: "Message (optional)",
    challengeMessagePlaceholder: "Add a short message...",
    rivalLabel: "Rival",
    partnerLabel: "Partner",
    rateModalTitle: "Rate This User",
    ratingLabel: "Rating",
    ratingCommentLabel: "Comment (optional)",
    ratingCommentPlaceholder: "What do you think about this user?",
  },
  ru: {
    loadFailed: "Не удалось загрузить профиль",
    profileUnavailableTitle: "Вы не можете просматривать этот профиль",
    profileUnavailableSubtitle: "Этот пользователь мог скрыть профиль или заблокировать вас.",
    notFound: "Пользователь не найден",
    signInToFollow: "Войдите, чтобы подписаться",
    followRequestSent: "⏳ Запрос отправлен",
    following: "Вы подписаны",
    follow: "Подписаться",
    message: "Написать",
    challenge: "Отправить вызов",
    rate: "Оценить",
    removeFollower: "Удалить подписчика",
    restrict: "Ограничить",
    unrestrict: "Снять ограничение",
    block: "Заблокировать",
    unblock: "Разблокировать",
    report: "Пожаловаться",
    blocked: "Заблокирован",
    followsYou: "Подписан на вас",
    dayStreak: "дн. подряд",
    memberSince: "в приложении с",
    postsTab: "Посты",
    listingsTab: "Объявления",
    ratingsTab: "Отзывы",
    statsTab: "Статистика",
    hiddenTitle: "Профиль закрыт",
    hiddenDesc: "Чтобы видеть публикации и детали, нужно подписаться на пользователя.",
    signInAndFollow: "Войти и подписаться",
    noActiveListings: "Нет активных объявлений",
    noRatings: "Пока нет отзывов",
    statsLoadFailed: "Не удалось загрузить статистику",
    totalMatches: "Всего матчей",
    completedMatches: "Завершено",
    currentStreak: "Текущая серия",
    longestStreak: "Лучший рекорд",
    ratingsCount: "оценок",
    bySport: "Матчи по видам спорта",
    monthlyActivity: "Активность за 12 месяцев",
    matches: "матчей",
    followers: "подписчиков",
    followingCountLabel: "подписок",
    editProfile: "Редактировать",
    yearsOld: "лет",
    noPosts: "Пока нет постов",
    responses: "ответов",
    loading: "Загрузка...",
    noOneYet: "Пока никого нет",
    unknownCity: "Город неизвестен",
    reportReceived: "Жалоба отправлена и будет проверена.",
    reportSendFailed: "Не удалось отправить жалобу",
    genericError: "Произошла ошибка",
    conversationStartFailed: "Не удалось начать диалог",
    signIn: "Войти",
    followRequestWithdrawn: "Запрос на подписку отменен",
    followStarted: "✓ Подписка оформлена",
    followStopped: "Подписка отменена",
    cancel: "Отмена",
    send: "Отправить",
    challengeModalTitle: "Вызов / поиск партнера",
    sportLabel: "Вид спорта",
    chooseSportLabel: "Выберите вид спорта",
    challengeTypeLabel: "Тип вызова",
    challengeDateLabel: "Предлагаемые дата и время (необязательно)",
    challengeMessageLabel: "Сообщение (необязательно)",
    challengeMessagePlaceholder: "Добавьте короткое сообщение...",
    rivalLabel: "Соперник",
    partnerLabel: "Партнер",
    rateModalTitle: "Оценить пользователя",
    ratingLabel: "Оценка",
    ratingCommentLabel: "Комментарий (необязательно)",
    ratingCommentPlaceholder: "Что вы думаете об этом пользователе?",
  },
} as const;
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={`text-2xl transition ${s <= value ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"} ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          aria-label={`${s} / 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

import BadgeChip from "@/components/social/BadgeChip";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const safeLocale = resolveAppLocale(locale);
  const uiLocale: "tr" | "en" | "ru" = safeLocale === "ru" ? "ru" : safeLocale === "tr" ? "tr" : "en";
  const dateLocale = getDateFnsLocale(locale);
  const tProfile = useTranslations("profile");
  const tHeader = useTranslations("profile.header");
  const copy = PUBLIC_PROFILE_COPY[uiLocale];
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileAccessError, setProfileAccessError] = useState<"blocked" | "private" | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "ratings" | "posts" | "stats">("posts");
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsView, setPostsView] = useState<"grid" | "list">("grid");

  // restricted state: kapalı profil (API'den gelen isRestricted flag'i)
  const isRestricted = !!profile?.isRestricted && id !== session?.user?.id;

  // Follow Modal states
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followListData, setFollowListData] = useState<any[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [pendingFollow, setPendingFollow] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  // Block / report / 3-dot menu state
  const [dotMenuOpen, setDotMenuOpen] = useState(false);
  const [blockStatus, setBlockStatus] = useState<"BLOCK" | "RESTRICT" | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDesc, setReportDesc] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  // Challenge state
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeForm, setChallengeForm] = useState({ sportId: "", challengeType: "RIVAL" as "RIVAL" | "PARTNER", message: "", proposedDateTime: "" });
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [sports, setSports] = useState<{ id: string; name: string; icon: string | null }[]>([]);

  const loadFollowStats = useCallback(async () => {
    try {
      const res = await getFollowStats(id);
      if (res.success && res.data) {
        setIsFollowing(res.data.isFollowing);
        setPendingFollow(res.data.pending ?? false);
        setFollowsMe(res.data.followsMe ?? false);
        setFollowerCount(res.data.followerCount);
        setFollowingCount(res.data.followingCount);
      }
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    Promise.all([
      getPublicProfile(id),
      getUserRatings(id),
      getLeaderboard(undefined, 100),
    ])
      .then(([p, r, lb]) => {
        if (p.success && p.data) {
          setProfile(p.data);
          setFollowerCount((p.data as PublicProfile & { followersCount?: number }).followersCount ?? 0);
          setFollowingCount((p.data as PublicProfile & { followingCount?: number }).followingCount ?? 0);
          // Pending follow isteği
          if ((p.data as any).pendingFollow) setPendingFollow(true);
          // Sizi engelleyen kullanıcı ise blockStatus'u BLOCK olarak ayarla
          if ((p.data as any).isBlockedByThem) {
            setBlockStatus("BLOCK");
          }
        } else if ((p as any).code === "BLOCKED") {
          // Hedef kullanıcı bizi engellemişÇ profil görüntülenemiyor
          setBlockStatus("BLOCK");
        }
        if (r.success && r.data) setRatings(r.data);
        if (lb.success && lb.data) {
          const entry = lb.data.find((e) => e.id === id);
          if (entry) setBadges(entry.badges);
        }
      })
      .catch((err) => {
        if (err instanceof APIError && err.status === 403) {
          // 403: engellendi
          setProfileAccessError("blocked");
        } else {
          toast.error("Profil yüklenemedi");
        }
      })
      .finally(() => setLoading(false));

    loadFollowStats();

    // Engelleme durumunu yükle
    if (session) {
      fetch(`/api/users/${id}/block`)
        .then(r => r.json())
        .then(json => { if (json.success) setBlockStatus(json.type ?? null); })
        .catch(() => {});
    }
  }, [id, loadFollowStats, session]);

  // Sporları yükle (teklif modalı için)
  useEffect(() => {
    fetch("/api/sports")
      .then((r) => r.json())
      .then((json) => { if (json.success) setSports(json.data ?? []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab !== "stats") return;
    setStatsLoading(true);
    fetch(`/api/users/${id}/stats`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setStatsData(json.data); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [id, activeTab]);

  useEffect(() => {
    if (activeTab !== "posts") return;
    setPostsLoading(true);
    fetch(`/api/posts?userId=${id}`)
      .then((r) => r.json())
      .then((json) => { if (Array.isArray(json.posts)) setPosts(json.posts); })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [id, activeTab]);

  const handleFollow = async () => {
    if (!session) { toast.error(copy.signInToFollow); return; }
    // Pending istek varsa iptal et / geri çek
    if (pendingFollow) {
      setFollowLoading(true);
      try {
        const res = await toggleFollow(id) as any;
        setPendingFollow(false);
        toast.success(res.message || copy.followRequestWithdrawn);
        // Sayaçları güncelle
        loadFollowStats();
      } catch { toast.error(copy.genericError); }
      finally { setFollowLoading(false); }
      return;
    }
    // Optimistic update — hemen butonu güncelle
    const next = !isFollowing;
    if (!profile?.isPrivateProfile) {
      setIsFollowing(next);
      setFollowerCount((prev) => next ? prev + 1 : prev - 1);
    }
    setFollowLoading(true);
    try {
      const res = await toggleFollow(id) as any;
      const actualFollowing = res.following ?? res.data?.following ?? next;
      const actualPending = res.pending ?? false;
      setIsFollowing(actualFollowing);
      setPendingFollow(actualPending);
      
      // Her durumda API'den güncel sayıları çekmek en sağlıklısı
      loadFollowStats();

      if (actualPending) {
        toast.success(copy.followRequestSent);
      } else {
        toast.success(actualFollowing ? copy.followStarted : copy.followStopped);
      }
    } catch (err) {
      // Hata durumunda optimistic update'i geri al
      if (!profile?.isPrivateProfile) {
        setIsFollowing(!next);
        setFollowerCount((prev) => next ? prev - 1 : prev + 1);
      }
      toast.error(err instanceof Error ? err.message : copy.genericError);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    setSubmittingRating(true);
    try {
      await submitRating(id, ratingScore, ratingComment);
      toast.success(tProfile("ratingSubmitted"));
      setRatingModal(false);
      // Refresh ratings
      const r = await getUserRatings(id);
      if (r.success && r.data) setRatings(r.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.genericError);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleBlock = async (type: "BLOCK" | "RESTRICT") => {
    if (!session) return;
    setBlockLoading(true);
    setDotMenuOpen(false);
    try {
      if (blockStatus === type) {
        const res = await fetch(`/api/users/${id}/block`, { method: "DELETE" });
        if ((await res.json()).success) {
          setBlockStatus(null);
          toast.success(type === "BLOCK" ? copy.unblock : copy.unrestrict);
        }
      } else {
        const res = await fetch(`/api/users/${id}/block`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const json = await res.json();
        if (json.success) {
          setBlockStatus(type);
          if (type === "BLOCK") { setIsFollowing(false); setFollowsMe(false); }
          toast.success(type === "BLOCK" ? copy.blocked : copy.restrict);
        } else {
          toast.error(json.error ?? "İşlem başarısız");
        }
      }
    } catch {
      toast.error(copy.genericError);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleReport = async () => {
    if (!session) return;
    setReportLoading(true);
    try {
      const res = await fetch(`/api/users/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, description: reportDesc || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(copy.reportReceived);
        setReportModal(false);
        setReportDesc("");
      } else {
        toast.error(json.error ?? copy.reportSendFailed);
      }
    } finally {
      setReportLoading(false);
    }
  };

  const loadFollowers = async () => {
    setFollowListLoading(true);
    setShowFollowersModal(true);
    try {
      const res = await fetch(`/api/users/${id}/followers`);
      const json = await res.json();
      if (json.success) setFollowListData(json.data);
    } catch { toast.error(copy.genericError); }
    finally { setFollowListLoading(false); }
  };

  const loadFollowing = async () => {
    setFollowListLoading(true);
    setShowFollowingModal(true);
    try {
      const res = await fetch(`/api/users/${id}/following`);
      const json = await res.json();
      if (json.success) setFollowListData(json.data);
    } catch { toast.error(copy.genericError); }
    finally { setFollowListLoading(false); }
  };

  const handleRemoveFollower = async () => {
    if (!session) return;
    setDotMenuOpen(false);
    try {
      const res = await removeFollower(id);
      if (res.success) {
        setFollowsMe(false);
        toast.success(copy.removeFollower);
      } else {
        toast.error("İşlem başarısız");
      }
    } catch {
      toast.error(copy.genericError);
    }
  };

  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeForm.sportId) { toast.error(tProfile("chooseSport")); return; }
    setChallengeLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: id,
          sportId: challengeForm.sportId,
          challengeType: challengeForm.challengeType,
          message: challengeForm.message || undefined,
          proposedDateTime: challengeForm.proposedDateTime || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(tProfile("challengeSent"));
        setShowChallengeModal(false);
        setChallengeForm({ sportId: "", challengeType: "RIVAL", message: "", proposedDateTime: "" });
      } else {
        toast.error(json.error ?? tProfile("challengeSendFailed"));
      }
    } catch {
      toast.error(copy.genericError);
    } finally {
      setChallengeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    if (profileAccessError === "blocked") {
      return (
        <div className="text-center py-16 max-w-sm mx-auto">
          <span className="text-6xl">🚫</span>
          <p className="mt-4 font-semibold text-gray-700 dark:text-gray-300">{copy.profileUnavailableTitle}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.profileUnavailableSubtitle}</p>
        </div>
      );
    }
    return (
      <div className="text-center py-16">
        <span className="text-6xl">😕</span>
        <p className="mt-4 text-gray-500 dark:text-gray-400">{copy.notFound}</p>
      </div>
    );
  }

  const joinDate = profile.createdAt ? format(new Date(profile.createdAt), "MMMM yyyy", { locale: dateLocale }) : "";

      // Gizlilik kontrolü: mesaj gönderme izni var mı?
      const whoCanMessage = profile.whoCanMessage ?? "EVERYONE";
  const canMessage =
    !isRestricted && (
      whoCanMessage === "EVERYONE" ||
      (whoCanMessage === "FOLLOWERS" && isFollowing)
    );

  // Gizlilik kontrolü: teklif gönderme izni var mı?
  const whoCanChallenge = profile.whoCanChallenge ?? "EVERYONE";
  const canChallenge =
    !isRestricted && (
      whoCanChallenge === "EVERYONE" ||
      (whoCanChallenge === "FOLLOWERS" && isFollowing)
    );

  return (
    <div className="max-w-2xl mx-auto pb-24 overflow-x-hidden">

      {/* ── COVER ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="h-40 sm:h-48 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 overflow-hidden">
          {(profile as any).coverUrl && (
            <img src={(profile as any).coverUrl} alt={tHeader("coverAlt")} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Edit on own profile */}
        {profile.isOwnProfile && (
          <Link href="/ayarlar/profil"
            className="absolute top-3 right-3 z-10 text-xs font-semibold px-3 py-1.5 rounded-full bg-black/40 text-white hover:bg-black/55 backdrop-blur-sm transition">
            ✏️ {copy.editProfile}
          </Link>
        )}
      </div>

      {/* ── PROFILE INFO ──────────────────────────────────── */}
      <div className="px-4 sm:px-5 relative z-10">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-1">
          <div
            className="relative block w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[3px] border-white dark:border-gray-900 shadow-md overflow-visible shrink-0"
          >
            <span className="absolute inset-0 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 z-[1] flex items-center justify-center text-2xl sm:text-3xl font-bold text-emerald-600">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : profile.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Actions — right side */}
          <div className="flex items-center gap-2 pb-1 pt-6 sm:pt-8 flex-wrap justify-end">
            {session && !profile.isOwnProfile && blockStatus !== "BLOCK" && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition ${
                  pendingFollow
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 cursor-default"
                    : isFollowing
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {followLoading ? "..." : pendingFollow ? copy.followRequestSent : isFollowing ? copy.following : copy.follow}
              </button>
            )}
            {!profile.isOwnProfile && (
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {/* Mesaj butonu: gizlilik ayarına göre gizle */}
                {session && blockStatus !== "BLOCK" && canMessage && (
                  <button
                    onClick={async () => {
                      if (!session) { toast.error(copy.signIn); return; }
                      setMessagingLoading(true);
                      try {
                        const res = await startDirectConversation(id);
                        if (res.success && res.data) router.push(`/mesajlar/dm/${res.data.id}`);
                        else toast.error(copy.conversationStartFailed);
                      } catch { toast.error(copy.conversationStartFailed); }
                      finally { setMessagingLoading(false); }
                    }}
                    disabled={messagingLoading}
                    title={copy.message}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm px-3 h-9"
                  ><span>💬</span></button>
                )}
                {/* Teklif butonu: engellenmemiş VE gizlilik izni varsa göster */}
                {session && blockStatus !== "BLOCK" && canChallenge && (
                  <button
                    onClick={() => setShowChallengeModal(true)}
                    title={copy.challenge}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition text-sm text-orange-600 dark:text-orange-400 px-3 h-9"
                  ><span>⚔️</span></button>
                )}
                {session && !isRestricted && (
                  <button
                    onClick={() => setRatingModal(true)}
                    title={copy.rate}
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition text-sm text-yellow-600 dark:text-yellow-400 px-3 h-9"
                  ><span>⭐</span></button>
                )}
                <button
                  onClick={() => setDotMenuOpen(v => !v)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-500 dark:text-gray-400 text-sm font-bold">
                  ···
                </button>
              </div>
            )}
            {dotMenuOpen && (
              <div className="relative">
                <div className="fixed inset-0 z-[100]" onClick={() => setDotMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[101] overflow-hidden py-1">
                  {followsMe && (
                    <button onClick={handleRemoveFollower} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      👤 {copy.removeFollower}
                    </button>
                  )}
                  <button onClick={() => handleBlock("RESTRICT")} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    🔇 {blockStatus === "RESTRICT" ? copy.unrestrict : copy.restrict}
                  </button>
                  <button onClick={() => handleBlock("BLOCK")} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    🚫 {blockStatus === "BLOCK" ? copy.unblock : copy.block}
                  </button>
                  <button onClick={() => { setDotMenuOpen(false); setReportModal(true); }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                    🚩 {copy.report}
                  </button>
                </div>
              </div>
            )}
            {blockStatus === "BLOCK" && (
              <span className="text-xs text-red-500 font-medium">🚫 {copy.blocked}</span>
            )}
          </div>
        </div>

        {/* Name + info */}
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">{profile.name}</h1>
            {profile.isVerifiedUser && (
              <span title="Doğrulanmış Kullanıcı" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold shrink-0" aria-label="Doğrulanmış Kullanıcı">✓</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {profile.city && (
              <span>{profile.city.name}{profile.city.country ? `, ${profile.city.country.name}` : ""}</span>
            )}
            {profile.birthDate && profile.city && <span>·</span>}
            {profile.birthDate && (
              <span>{differenceInYears(new Date(), new Date(profile.birthDate))} {copy.yearsOld}</span>
            )}
          </div>
          {followsMe && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 inline-block">{copy.followsYou}</span>
          )}
        </div>

        {/* Social links */}
        <SocialLinksRow
          links={{
            instagram: (profile as any).instagram,
            tiktok: (profile as any).tiktok,
            facebook: (profile as any).facebook,
            twitterX: (profile as any).twitterX,
            telegram: (profile as any).telegram,
            whatsapp: (profile as any).whatsapp,
          }}
          className="mb-3"
        />

        {/* Stats — clean inline row */}
        <div className="flex items-center gap-4 text-sm mb-3 flex-wrap">
          <span><strong className="text-gray-900 dark:text-white">{profile.totalMatches ?? 0}</strong> <span className="text-gray-500 dark:text-gray-400">{copy.matches}</span></span>
          <button onClick={() => !isRestricted && loadFollowers()} className="hover:opacity-80 transition">
            <strong className="text-gray-900 dark:text-white">{followerCount}</strong> <span className="text-gray-500 dark:text-gray-400">{copy.followers}</span>
          </button>
          <button onClick={() => !isRestricted && loadFollowing()} className="hover:opacity-80 transition">
            <strong className="text-gray-900 dark:text-white">{followingCount}</strong> <span className="text-gray-500 dark:text-gray-400">{copy.followingCountLabel}</span>
          </button>
          {profile.avgRating !== null && profile.avgRating !== undefined && (
            <span><strong className="text-gray-900 dark:text-white">{profile.avgRating.toFixed(1)}</strong> <span className="text-gray-500 dark:text-gray-400">★ ({profile.ratingCount})</span></span>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{profile.bio}</p>
        )}

        {/* Sports + badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(profile.sports ?? []).map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full">
              {s.icon} {localizeSportName(s.name, locale)}
            </span>
          ))}
          {badges.length > 0 && badges.map((b) => <BadgeChip key={b.id} badge={b} />)}
          {(profile as any).currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
              🔥 {(profile as any).currentStreak} {copy.dayStreak}
            </span>
          )}
        </div>

        {/* Clubs */}
        {(profile as any).clubs?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(profile as any).clubs.map((c: { id: string; name: string; role: string; sport?: { icon?: string | null } | null }) => (
              <span key={c.id} className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                {c.sport?.icon ?? "🏅"} {c.name}{c.role === "CAPTAIN" ? " 👑" : ""}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">📅 {joinDate} {copy.memberSince}</p>
      </div>

      {/* ── TABS ──────────────────────────────────────────── */}
      <div className="sticky top-[56px] z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex max-w-2xl mx-auto">
          {[
            { key: "posts",    label: copy.postsTab },
            { key: "listings", label: `${copy.listingsTab}${(profile as any).activeListings?.length > 0 ? ` (${(profile as any).activeListings.length})` : ""}` },
            { key: "ratings",  label: `${copy.ratingsTab}${ratings.length > 0 ? ` (${ratings.length})` : ""}` },
            { key: "stats",    label: copy.statsTab },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors relative ${
                activeTab === t.key
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
              {activeTab === t.key && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────── */}
      <div className="px-4 sm:px-5 pt-4">

      {/* ── RESTRICTED OVERLAY ────────────────────────────── */}
      {isRestricted && (
        <div className="py-16 px-6 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-emerald-600 dark:text-emerald-400">🔒</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{copy.hiddenTitle}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
            {copy.hiddenDesc}
          </p>
          {!session && (
            <button 
              onClick={() => router.push("/auth/giris")}
              className="mt-5 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
            >
              {copy.signInAndFollow}
            </button>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {!isRestricted && activeTab === "posts" && (
        <div>
          {posts.length > 0 && (
            <div className="flex justify-end gap-1 mb-3">
              <button onClick={() => setPostsView("grid")} className={`p-2 rounded-lg text-lg leading-none transition ${postsView === "grid" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>⊞</button>
              <button onClick={() => setPostsView("list")} className={`p-2 rounded-lg text-lg leading-none transition ${postsView === "list" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>☰</button>
            </div>
          )}
          {postsLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-2">📸</p>
              <p className="text-sm">{copy.noPosts}</p>
            </div>
          ) : postsView === "grid" ? (
            <div className="grid grid-cols-3 gap-0.5 rounded-lg overflow-hidden">
              {posts.map((post) => (
                <button key={post.id} onClick={() => setPostsView("list")} className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                  {post.images?.[0] ? (
                    <img src={post.images[0]} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition duration-200" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-5 text-center leading-relaxed font-medium">{post.content}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-bold drop-shadow">❤️ {post._count?.likes ?? 0}</span>
                    <span className="text-white text-xs font-bold drop-shadow">💬 {post._count?.comments ?? 0}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLikeToggle={(pid, liked, count) => {
                    setPosts(prev => prev.map(p => p.id === pid ? { ...p, liked, _count: { ...p._count, likes: count } } : p));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* İlanlar */}
      {!isRestricted && activeTab === "listings" && (
        <div className="space-y-3">
          {profile.activeListings.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{copy.noActiveListings}</p>
          ) : (
            profile.activeListings.map((listing) => (
              <Link key={listing.id} href={`/ilan/${listing.id}`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{listing.sport?.icon || "🏆"}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{listing.sport?.name ? localizeSportName(listing.sport.name, locale) : ""}</span>
                      <BadgeComp variant={listing.type === "RIVAL" ? "orange" : listing.type === "EQUIPMENT" ? "purple" : "emerald"} size="sm">
                        {localizeListingType(listing.type, locale)}
                      </BadgeComp>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${LEVEL_COLORS[listing.level]}`}>
                      {LEVEL_LABELS[listing.level]}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-3">
                    <span>📍 {listing.district?.city?.name}, {listing.district?.name}</span>
                    <span>📅 {format(new Date(listing.dateTime), "d MMM HH:mm", { locale: dateLocale })}</span>
                    <span>💬 {listing._count?.responses ?? 0} {copy.responses}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Değerlendirmeler */}
      {!isRestricted && activeTab === "ratings" && (
        <div className="space-y-3">
          {ratings.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{copy.noRatings}</p>
          ) : (
            ratings.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/profil/${r.ratedBy.id}`} className="flex items-center gap-2 hover:underline">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-600">
                      {r.ratedBy.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{r.ratedBy.name}</span>
                  </Link>
                  <StarRating value={r.score} />
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">&quot;{r.comment}&quot;</p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {format(new Date(r.createdAt), "d MMMM yyyy", { locale: dateLocale })}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* İstatistikler */}
      {!isRestricted && activeTab === "stats" && (
        <div className="space-y-5 pb-8">
          {statsLoading ? (
            <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
          ) : !statsData ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-12">{copy.statsLoadFailed}</p>
          ) : (
            <>
              {/* Özet kartlar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: copy.totalMatches, value: statsData.totalMatches, icon: "⚔️" },
                  { label: copy.completedMatches, value: statsData.completedMatches, icon: "✅" },
                  { label: copy.currentStreak, value: `${statsData.currentStreak} 🔥`, icon: "📅" },
                  { label: copy.longestStreak,  value: `${statsData.longestStreak} 🏆`, icon: "🌟" },
                ].map((card) => (
                  <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl mb-1">{card.icon}</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Ortalama puan */}
              {statsData.avgRating !== null && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{statsData.avgRating}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{statsData.ratingCount} {copy.ratingsCount}</p>
                  </div>
                </div>
              )}

              {/* Spora göre dağılım */}
              {statsData.bySport.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{copy.bySport}</h3>
                  <div className="space-y-2">
                    {statsData.bySport.map((s: any) => {
                      const max = statsData.bySport[0]?.matchCount || 1;
                      return (
                        <div key={s.id}>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                            <span>{s.icon || "🏅"} {localizeSportName(s.name, locale)}</span>
                            <span className="font-semibold">{s.matchCount} {copy.matches}{s.avgRating ? ` · ⭐${s.avgRating}` : ""}</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((s.matchCount / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aylık aktivite */}
              {statsData.monthly.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{copy.monthlyActivity}</h3>
                  <div className="flex items-end gap-1 h-20">
                    {statsData.monthly.map((m: any) => {
                      const maxM = Math.max(...statsData.monthly.map((x: any) => x.count), 1);
                      const heightPct = Math.round((m.count / maxM) * 100);
                      const label = m.month.slice(5); // MM only
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5" title={`${m.month}: ${m.count} ${copy.matches}`}>
                          <div className="w-full flex flex-col justify-end h-16">
                            <div
                              className={`w-full rounded-sm transition-all duration-500 ${m.count > 0 ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-700"}`}
                              style={{ height: m.count > 0 ? `${Math.max(heightPct, 8)}%` : "4px" }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      </div>{/* end tab content */}

      {/* Teklif Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowChallengeModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">⚔️ {copy.challengeModalTitle}</h2>
            <form onSubmit={handleChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{copy.sportLabel} *</label>
                <select
                  required
                  value={challengeForm.sportId}
                  onChange={(e) => setChallengeForm({ ...challengeForm, sportId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">{copy.chooseSportLabel}</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {localizeSportName(s.name, locale)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{copy.challengeTypeLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["RIVAL", "PARTNER"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setChallengeForm({ ...challengeForm, challengeType: t })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${challengeForm.challengeType === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"}`}
                    >
                      {t === "RIVAL" ? `⚔️ ${copy.rivalLabel}` : `🤝 ${copy.partnerLabel}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{copy.challengeDateLabel}</label>
                <input
                  type="datetime-local"
                  value={challengeForm.proposedDateTime}
                  onChange={(e) => setChallengeForm({ ...challengeForm, proposedDateTime: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{copy.challengeMessageLabel}</label>
                <textarea
                  value={challengeForm.message}
                  onChange={(e) => setChallengeForm({ ...challengeForm, message: e.target.value })}
                  rows={3}
                  maxLength={300}
                  placeholder={copy.challengeMessagePlaceholder}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowChallengeModal(false)} type="button">{copy.cancel}</Button>
                <Button type="submit" loading={challengeLoading}>⚔️ {copy.send}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Değerlendirme Modal */}
      {ratingModal && (        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRatingModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{copy.rateModalTitle}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{copy.ratingLabel}</label>
                <StarRating value={ratingScore} onChange={setRatingScore} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{copy.ratingCommentLabel}</label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={copy.ratingCommentPlaceholder}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setRatingModal(false)}>{copy.cancel}</Button>
                <Button onClick={handleRatingSubmit} loading={submittingRating}>{copy.send}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şikayet Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">🚩 Şikayet Et</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sebep</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="SPAM">📧 Spam</option>
                  <option value="HARASSMENT">😡 Taciz / Zorbalık</option>
                  <option value="FAKE_PROFILE">🎭 Sahte Profil</option>
                  <option value="INAPPROPRIATE_CONTENT">⚠️ Uygunsuz İçerik</option>
                  <option value="SCAM">💸 Dolandırıcılık</option>
                  <option value="OTHER">🔖 Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama (opsiyonel)</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Detaylı bilgi verebilirsiniz..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setReportModal(false)}>İptal</Button>
                <Button onClick={handleReport} loading={reportLoading} className="bg-orange-600 hover:bg-orange-700 text-white">Gönder</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Followers / Following Modal */}
      {(showFollowersModal || showFollowingModal) && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => { setShowFollowersModal(false); setShowFollowingModal(false); setFollowListData([]); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md z-10">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {showFollowersModal ? copy.followers : copy.followingCountLabel}
              </h3>
              <button 
                onClick={() => { setShowFollowersModal(false); setShowFollowingModal(false); setFollowListData([]); }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {followListLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500">{copy.loading}</p>
                </div>
              ) : followListData.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-400 text-sm">{copy.noOneYet}</p>
                </div>
              ) : (
                followListData.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                        setShowFollowersModal(false); 
                        setShowFollowingModal(false);
                        router.push(`/profil/${item.id}`);
                    }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="relative">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={item.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-500/30 transition-all" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                          {item.name?.[0] ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {item.city?.name || copy.unknownCity}
                      </div>
                    </div>
                    <div className="pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
