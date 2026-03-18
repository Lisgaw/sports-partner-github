"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useLocale } from "next-intl";
import toast from "@/lib/toast";
import type { ListingDetail, ListingResponse, ListingSummary } from "@/types";
import ListingCard from "@/components/ListingCard";
import { LEVEL_LABELS_WITH_ICON, STATUS_LABELS, ALLOWED_GENDER_LABELS } from "@/types";
import { getListingDetail, sendResponse, handleResponse as handleResponseApi, closeListing, deleteListing, reportNoShow } from "@/services/api";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { getDateFnsLocale, resolveAppLocale } from "@/lib/localized-ui";

const LISTING_DETAIL_COPY = {
  tr: {
    expired: "Süresi doldu", remaining: "kaldı", urgent: "ACİL",
    blindMatch: "Kör Maç", anonymousUser: "Anonim Kullanıcı",
    responses: "karşılık", report: "Şikayet Et",
    rosterFill: "Kadro Doluluk", people: "kişi",
    trainerInfo: "Eğitmen Bilgileri", verified: "Onaylı",
    hourlyRate: "Saatlik Ücret", perHour: "/ saat", years: "yıl",
    productDetails: "Ürün Detayları", price: "Fiyat", condition: "Durum",
    condNew: "✨ Sıfır", condLikeNew: "🌟 Sıfır Gibi", condGood: "👍 İyi", condFair: "🔧 Orta",
    brand: "Marka", model: "Model", productImage: "Ürün görseli",
    productSold: "Bu ürün satılmıştır",
    membershipDetails: "Üyelik Detayları", type: "Tür", quota: "Kontenjan",
    trialPackage: "Deneme Paketi", trialYes: "Var", trialNo: "Yok", trialPrice: "Deneme Fiyatı",
    classDetails: "Ders / Kurs Detayları", className: "Ders", instructor: "Eğitmen",
    schedule: "Takvim", difficulty: "Zorluk", sessionPrice: "Seans Fiyatı", monthlyPrice: "Aylık Fiyat",
    venueProductDetails: "Ürün Detayları", product: "Ürün", category: "Kategori", unit: "Birim",
    stock: "Stok", inStock: "Mevcut", outOfStock: "Tükendi",
    serviceDetails: "Hizmet Detayları", service: "Hizmet", duration: "Süre", minutes: "dk",
    qualifications: "Uzmanlık / Nitelikler",
    matchMade: "Eşleşme Gerçekleşti!", listingOwner: "İlan Sahibi", participant: "Katılımcı",
    matchedPerson: "Eşleşen Kişi",
    matchPastTitle: "Maç Tarihi Geçti",
    matchPastDesc: "Etkinlik zamanı geçti. Maçı oynadıysanız lütfen onaylayın, oynamadıysanız bildirin.",
    confirmMatch: "Maçı Oynadık (Onayla)", noShowReport: "Gelmedi (Bildir)", sending: "Gönderiliyor...",
    matchDone: "Maç Bitti!", ratePartner: "Partnerinizi değerlendirmek ister misiniz?", rateBtn: "Değerlendir",
    respondTitle: "Karşılık Ver",
    respondPlaceholder: "Mesajınızı yazın (opsiyonel, max 500 karakter)...",
    respondBtn: "Karşılık Gönder",
    signInPrompt: "Karşılık vermek için", signInLink: "giriş yapmanız", signInSuffix: "gerekiyor.",
    alreadyResponded: "Bu ilana zaten karşılık verdiniz",
    capacityFull: "Kontenjan Dolu",
    incomingResponses: "Gelen Karşılıklar", accept: "Kabul Et", reject: "Reddet",
    similarListings: "Benzer İlanlar",
    deleteTitle: "İlanı Sil", deleteDesc: "Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.", deleteConfirm: "İlanı Sil",
    closeTitle: "İlanı Kapat", closeDesc: "Bu ilanı kapatmak istediğinize emin misiniz? Bekleyen tüm karşılıklar reddedilecektir.", closeConfirm: "İlanı Kapat",
    reportTitle: "İlan Sahibini Şikayet Et", reportReason: "Sebep",
    reportDescLabel: "Açıklama (opsiyonel)", reportDescPlaceholder: "Detaylı bilgi verebilirsiniz...",
    cancelBtn: "İptal", sendBtn: "Gönder",
    notFound: "İlan bulunamadı", loadFailed: "İlan yüklenemedi",
    responseSent: "Karşılığınız gönderildi!", deleted: "İlan silindi", closed: "İlan kapatıldı",
    noShowSent: "Gelmedi bildirimi gönderildi", noShowFailed: "Bildirim gönderilemedi",
    matchCompleted: "Maç tamamlandı! 🎉 +10 puan kazandınız", matchFailed: "Maç tamamlanamadı",
    ratingSelectPrompt: "Lütfen bir puan seçin", ratingSent: "Değerlendirmeniz gönderildi ⭐",
    ratingFailed: "Değerlendirme gönderilemedi", reportReceived: "Şikayetiniz alındı",
    reportFailed: "Şikayet gönderilemedi", genericError: "Bir hata oluştu", error: "Hata oluştu",
    loading: "Yükleniyor",
    statusMatched: "✅ Eşleşti", statusClosed: "Kapatıldı", statusOpen: "🟢 Açık",
    edit: "Düzenle", close: "Kapat", deleteBtn: "Sil",
    noShowConfirm: "Bu kişi etkinliğe gelmedi mi? Bu bildirim geri alınamaz.",
    typeRival: "🥊 Rakip Arıyor", typePartner: "🤝 Partner Arıyor", typeTrainer: "🎓 Eğitmen",
    typeEquipment: "🛒 Satılık", typeMembership: "💳 Üyelik", typeClass: "📚 Ders / Kurs",
    typeProduct: "🛍️ Ürün", typeService: "🔧 Hizmet",
  },
  en: {
    expired: "Expired", remaining: "left", urgent: "URGENT",
    blindMatch: "Blind Match", anonymousUser: "Anonymous User",
    responses: "responses", report: "Report",
    rosterFill: "Roster Capacity", people: "people",
    trainerInfo: "Trainer Info", verified: "Verified",
    hourlyRate: "Hourly Rate", perHour: "/ hour", years: "yr",
    productDetails: "Product Details", price: "Price", condition: "Condition",
    condNew: "✨ New", condLikeNew: "🌟 Like New", condGood: "👍 Good", condFair: "🔧 Fair",
    brand: "Brand", model: "Model", productImage: "Product image",
    productSold: "This product has been sold",
    membershipDetails: "Membership Details", type: "Type", quota: "Capacity",
    trialPackage: "Trial Package", trialYes: "Available", trialNo: "N/A", trialPrice: "Trial Price",
    classDetails: "Class / Course Details", className: "Class", instructor: "Instructor",
    schedule: "Schedule", difficulty: "Difficulty", sessionPrice: "Per Session", monthlyPrice: "Monthly Price",
    venueProductDetails: "Product Details", product: "Product", category: "Category", unit: "Unit",
    stock: "Stock", inStock: "Available", outOfStock: "Sold Out",
    serviceDetails: "Service Details", service: "Service", duration: "Duration", minutes: "min",
    qualifications: "Qualifications / Expertise",
    matchMade: "It's a Match!", listingOwner: "Listing Owner", participant: "Participant",
    matchedPerson: "Matched User",
    matchPastTitle: "Match Date Passed",
    matchPastDesc: "The event time has passed. Please confirm if you played, or report if the opponent didn't show up.",
    confirmMatch: "We Played (Confirm)", noShowReport: "No-show (Report)", sending: "Sending...",
    matchDone: "Match Complete!", ratePartner: "Would you like to rate your partner?", rateBtn: "Rate",
    respondTitle: "Send a Response",
    respondPlaceholder: "Write your message (optional, max 500 chars)...",
    respondBtn: "Send Response",
    signInPrompt: "To respond,", signInLink: "sign in", signInSuffix: "required.",
    alreadyResponded: "You have already responded to this listing",
    capacityFull: "Capacity Full",
    incomingResponses: "Incoming Responses", accept: "Accept", reject: "Reject",
    similarListings: "Similar Listings",
    deleteTitle: "Delete Listing", deleteDesc: "Are you sure you want to delete this listing? This action cannot be undone.", deleteConfirm: "Delete Listing",
    closeTitle: "Close Listing", closeDesc: "Are you sure you want to close this listing? All pending responses will be rejected.", closeConfirm: "Close Listing",
    reportTitle: "Report Listing Owner", reportReason: "Reason",
    reportDescLabel: "Description (optional)", reportDescPlaceholder: "Provide details...",
    cancelBtn: "Cancel", sendBtn: "Send",
    notFound: "Listing not found", loadFailed: "Could not load listing",
    responseSent: "Your response has been sent!", deleted: "Listing deleted", closed: "Listing closed",
    noShowSent: "No-show report sent", noShowFailed: "Could not send report",
    matchCompleted: "Match completed! 🎉 +10 points earned", matchFailed: "Could not complete match",
    ratingSelectPrompt: "Please select a rating", ratingSent: "Your rating has been submitted ⭐",
    ratingFailed: "Could not submit rating", reportReceived: "Your report has been received",
    reportFailed: "Could not send report", genericError: "Something went wrong", error: "Error",
    loading: "Loading",
    statusMatched: "✅ Matched", statusClosed: "Closed", statusOpen: "🟢 Open",
    edit: "Edit", close: "Close", deleteBtn: "Delete",
    noShowConfirm: "Did this person not show up? This report cannot be undone.",
    typeRival: "🥊 Looking for Rival", typePartner: "🤝 Looking for Partner", typeTrainer: "🎓 Trainer",
    typeEquipment: "🛒 For Sale", typeMembership: "💳 Membership", typeClass: "📚 Class / Course",
    typeProduct: "🛍️ Product", typeService: "🔧 Service",
  },
  ru: {
    expired: "Истекло", remaining: "осталось", urgent: "СРОЧНО",
    blindMatch: "Слепой матч", anonymousUser: "Анонимный пользователь",
    responses: "откликов", report: "Пожаловаться",
    rosterFill: "Состав", people: "чел.",
    trainerInfo: "Информация о тренере", verified: "Подтверждён",
    hourlyRate: "Стоимость часа", perHour: "/ час", years: "лет",
    productDetails: "Информация о товаре", price: "Цена", condition: "Состояние",
    condNew: "✨ Новый", condLikeNew: "🌟 Как новый", condGood: "👍 Хороший", condFair: "🔧 Средний",
    brand: "Бренд", model: "Модель", productImage: "Фото товара",
    productSold: "Этот товар продан",
    membershipDetails: "Детали абонемента", type: "Тип", quota: "Лимит",
    trialPackage: "Пробный период", trialYes: "Есть", trialNo: "Нет", trialPrice: "Пробная цена",
    classDetails: "Детали занятий", className: "Занятие", instructor: "Инструктор",
    schedule: "Расписание", difficulty: "Сложность", sessionPrice: "За занятие", monthlyPrice: "В месяц",
    venueProductDetails: "Детали товара", product: "Товар", category: "Категория", unit: "Единица",
    stock: "Наличие", inStock: "В наличии", outOfStock: "Нет в наличии",
    serviceDetails: "Детали услуги", service: "Услуга", duration: "Длительность", minutes: "мин",
    qualifications: "Квалификация / Навыки",
    matchMade: "Совпадение найдено!", listingOwner: "Автор объявления", participant: "Участник",
    matchedPerson: "Партнёр",
    matchPastTitle: "Дата матча прошла",
    matchPastDesc: "Время события прошло. Подтвердите, если вы играли, или сообщите о неявке.",
    confirmMatch: "Мы играли (Подтвердить)", noShowReport: "Не пришёл (Сообщить)", sending: "Отправка...",
    matchDone: "Матч завершён!", ratePartner: "Хотите оценить партнёра?", rateBtn: "Оценить",
    respondTitle: "Отправить отклик",
    respondPlaceholder: "Напишите сообщение (необязательно, макс. 500 символов)...",
    respondBtn: "Отправить отклик",
    signInPrompt: "Чтобы откликнуться,", signInLink: "войдите", signInSuffix: ".",
    alreadyResponded: "Вы уже откликнулись на это объявление",
    capacityFull: "Мест нет",
    incomingResponses: "Входящие отклики", accept: "Принять", reject: "Отклонить",
    similarListings: "Похожие объявления",
    deleteTitle: "Удалить объявление", deleteDesc: "Вы уверены? Это действие нельзя отменить.", deleteConfirm: "Удалить",
    closeTitle: "Закрыть объявление", closeDesc: "Вы уверены? Все ожидающие отклики будут отклонены.", closeConfirm: "Закрыть",
    reportTitle: "Пожаловаться на автора", reportReason: "Причина",
    reportDescLabel: "Описание (необязательно)", reportDescPlaceholder: "Опишите подробнее...",
    cancelBtn: "Отмена", sendBtn: "Отправить",
    notFound: "Объявление не найдено", loadFailed: "Не удалось загрузить",
    responseSent: "Ваш отклик отправлен!", deleted: "Объявление удалено", closed: "Объявление закрыто",
    noShowSent: "Сообщение о неявке отправлено", noShowFailed: "Не удалось отправить",
    matchCompleted: "Матч завершён! 🎉 +10 очков", matchFailed: "Не удалось завершить матч",
    ratingSelectPrompt: "Пожалуйста, выберите оценку", ratingSent: "Ваша оценка отправлена ⭐",
    ratingFailed: "Не удалось отправить оценку", reportReceived: "Жалоба получена",
    reportFailed: "Не удалось отправить жалобу", genericError: "Произошла ошибка", error: "Ошибка",
    loading: "Загрузка",
    statusMatched: "✅ Совпадение", statusClosed: "Закрыто", statusOpen: "🟢 Открыто",
    edit: "Редактировать", close: "Закрыть", deleteBtn: "Удалить",
    noShowConfirm: "Этот человек не пришёл? Это сообщение нельзя отменить.",
    typeRival: "🥊 Ищет соперника", typePartner: "🤝 Ищет партнёра", typeTrainer: "🎓 Тренер",
    typeEquipment: "🛒 Продаётся", typeMembership: "💳 Абонемент", typeClass: "📚 Занятия",
    typeProduct: "🛍️ Товар", typeService: "🔧 Услуга",
  },
} as const;

type ListingCopy = typeof LISTING_DETAIL_COPY;
type ListingCopyKeys = keyof ListingCopy;

const LISTING_TYPE_LABEL_KEYS: Record<string, keyof typeof LISTING_DETAIL_COPY["tr"]> = {
  RIVAL: "typeRival", PARTNER: "typePartner", TRAINER: "typeTrainer", EQUIPMENT: "typeEquipment",
  VENUE_MEMBERSHIP: "typeMembership", VENUE_CLASS: "typeClass", VENUE_PRODUCT: "typeProduct", VENUE_SERVICE: "typeService",
};

// Acil ilan geri sayım badge
function UrgentBadge({ expiresAt, copy }: { expiresAt: string; copy: (typeof LISTING_DETAIL_COPY)[keyof typeof LISTING_DETAIL_COPY] }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining(copy.expired); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")} ${copy.remaining}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt, copy]);
  return (
    <span className="inline-flex items-center gap-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold px-3 py-1 rounded-full animate-pulse tabular-nums">
      ⚡ {copy.urgent} · {remaining}
    </span>
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noShowSending, setNoShowSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratedThisSession, setRatedThisSession] = useState(false);
  const [similar, setSimilar] = useState<ListingSummary[]>([]);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDesc, setReportDesc] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const currentUserId = session?.user?.id;

  const locale = useLocale();
  const safeLocale = resolveAppLocale(locale);
  const copy = LISTING_DETAIL_COPY[safeLocale as ListingCopyKeys] ?? LISTING_DETAIL_COPY.en;
  const dateFnsLocale = getDateFnsLocale(safeLocale);

  const fetchListing = useCallback(async () => {
    try {
      const data = await getListingDetail(id);
      if (data.success && data.data) setListing(data.data);
      else toast.error(copy.notFound);
    } catch {
      toast.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [id, copy]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    if (!listing) return;
    const sportId = listing.sport?.id;
    if (!sportId) return;
    const cityId = listing.district?.city?.id;
    const params = new URLSearchParams({ sportId, pageSize: "5" });
    if (cityId) params.set("cityId", cityId);
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSimilar(
            (data.data?.listings ?? []).filter((l: ListingSummary) => l.id !== listing.id).slice(0, 4)
          );
        }
      })
      .catch(() => {});
  }, [listing]);

  const handleSendResponse = async () => {
    if (!session) {
      router.push("/auth/giris");
      return;
    }
    setSending(true);
    try {
      await sendResponse(id, responseMessage);
      toast.success(copy.responseSent);
      setResponseMessage("");
      fetchListing();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.genericError);
    } finally {
      setSending(false);
    }
  };

  const responseMessages = {
    tr: { accept: "Karşılık kabul edildi! 🎉", reject: "Karşılık reddedildi" },
    en: { accept: "Response accepted! 🎉", reject: "Response rejected" },
    ru: { accept: "Заявка принята! 🎉", reject: "Заявка отклонена" },
  } as const;
  const msg = responseMessages[locale as keyof typeof responseMessages] || responseMessages.en;

  const handleResponseAction = async (responseId: string, action: "accept" | "reject") => {
    setActionLoading(responseId);
    try {
      await handleResponseApi(responseId, action);
      toast.success(action === "accept" ? msg.accept : msg.reject);
      fetchListing();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.genericError);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteListing(id);
      toast.success(copy.deleted);
      router.push("/profil");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.error);
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await closeListing(id);
      toast.success(copy.closed);
      fetchListing();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.error);
    } finally {
      setClosing(false);
      setCloseModal(false);
    }
  };

  const handleNoShow = async (matchId: string) => {
    if (!confirm(copy.noShowConfirm)) return;
    setNoShowSending(true);
    try {
      await reportNoShow(matchId);
      toast.success(copy.noShowSent);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.noShowFailed);
    } finally {
      setNoShowSending(false);
    }
  };

  const handleCompleteMatch = async (matchId: string) => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || copy.matchFailed);
      toast.success(copy.matchCompleted);
      fetchListing();
      setShowRatingModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.error);
    } finally {
      setCompleting(false);
    }
  };

  const handleRate = async (matchId: string, ratedUserId: string) => {
    if (ratingScore === 0) { toast.error(copy.ratingSelectPrompt); return; }
    setRatingSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, ratedUserId, score: ratingScore, comment: ratingComment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || copy.ratingFailed);
      toast.success(copy.ratingSent);
      setShowRatingModal(false);
      setRatedThisSession(true);
      fetchListing();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.error);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleReportUser = async () => {
    if (!listing?.userId) return;
    setReportLoading(true);
    try {
      const res = await fetch(`/api/users/${listing.userId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, description: reportDesc || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || copy.reportFailed);
      toast.success(data.message || copy.reportReceived);
      setReportModal(false);
      setReportDesc("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.error);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" aria-label={copy.loading}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl" role="img" aria-label="">😕</span>
        <p className="mt-4 text-gray-500 dark:text-gray-400">{copy.notFound}</p>
      </div>
    );
  }

  const isOwner = currentUserId === listing.userId;
  const hasResponded = listing.responses?.some((r: ListingResponse) => r.userId === currentUserId);
  const isMatched = listing.status === "MATCHED";
  const isClosed = listing.status === "CLOSED";
  const acceptedCount = listing.responses?.filter((r: ListingResponse) => r.status === "ACCEPTED").length ?? 0;
  
  // Kapasite kontrolü: (Sahibi + kabul edilenler) < Toplam Kapasite
  const isCapacityFull = (acceptedCount + 1) >= listing.maxParticipants;
  const canRespond = !isOwner && !isMatched && !isClosed && !hasResponded && !isCapacityFull && session;

  const capacityFill = listing.maxParticipants > 2 ? Math.min(((acceptedCount + 1) / listing.maxParticipants) * 100, 100) : 0;
  const isMatchParticipant = listing.match && (currentUserId === listing.match.user1Id || currentUserId === listing.match.user2Id);
  const matchInPast = listing.match && new Date(listing.dateTime) < new Date();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Üst bilgi */}
      <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label={listing.sport?.name}>
              {listing.sport?.icon || "🏅"}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {listing.sport?.name}
              </h1>
              <Badge variant={listing.type === "RIVAL" ? "orange" : listing.type === "TRAINER" ? "blue" : listing.type === "EQUIPMENT" ? "purple" : "emerald"} size="md">
                {copy[LISTING_TYPE_LABEL_KEYS[listing.type] ?? "typePartner"]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && listing.status === "OPEN" && (
              <>
                <Link href={`/ilan/${id}/duzenle`}>
                  <Button variant="secondary" size="sm">{copy.edit}</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => setCloseModal(true)}>
                  {copy.close}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>
                  {copy.deleteBtn}
                </Button>
              </>
            )}
            <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${STATUS_LABELS[listing.status]?.className || ""}`}>
              {isMatched ? copy.statusMatched : isClosed ? copy.statusClosed : copy.statusOpen}
            </span>
            {(listing as any).isUrgent && (listing as any).expiresAt && new Date((listing as any).expiresAt) > new Date() && (
              <UrgentBadge expiresAt={(listing as any).expiresAt} copy={copy} />
            )}
            {(listing as any).isAnonymous && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold px-3 py-1 rounded-full">
                🕵️ {copy.blindMatch}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span role="img" aria-label="konum">📍</span>
              <span>
                {listing.district?.city?.country?.name} / {listing.district?.city?.name} / {listing.district?.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span role="img" aria-label="tarih">📅</span>
              <time dateTime={listing.dateTime}>
                {format(new Date(listing.dateTime), "d MMMM yyyy, HH:mm", { locale: dateFnsLocale })}
              </time>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span role="img" aria-label="seviye">📊</span>
              <span>{LEVEL_LABELS_WITH_ICON[listing.level]}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span role="img" aria-label="kullanıcı">👤</span>
              {listing.userId === "anonymous" ? (
                <span className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-gray-400">
                  🕵️ {copy.anonymousUser}
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{copy.blindMatch}</span>
                </span>
              ) : (
                <Link href={`/profil/${listing.userId}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition font-medium">
                  {listing.user?.name}
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span role="img" aria-label="mesaj">💬</span>
              <span>{listing.responses?.length || 0} {copy.responses}</span>
            </div>
            {!isOwner && session && listing.userId !== "anonymous" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportModal(true)}
                  className="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  🚩 {copy.report}
                </button>
              </div>
            )}
            {listing.allowedGender && listing.allowedGender !== "ANY" && (
              <div className="flex items-center gap-2">
                <span role="img" aria-label="cinsiyet kısıtı">🚦</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  listing.allowedGender === "FEMALE_ONLY"
                    ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                }`}>
                  {ALLOWED_GENDER_LABELS[listing.allowedGender]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Kadro progress bar — sadece grup ilanlarında */}
        {listing.maxParticipants > 2 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>👥 {copy.rosterFill}</span>
              <span className="font-semibold">{acceptedCount + 1} / {listing.maxParticipants} {copy.people}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div
                className="bg-emerald-500 rounded-full h-2.5 transition-all"
                style={{ width: `${capacityFill}%` }}
              />
            </div>
          </div>
        )}

        {listing.description && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">{listing.description}</p>
          </div>
        )}

        {/* ── Eğitmen Bilgileri ── */}
        {listing.type === "TRAINER" && listing.trainerProfile && (
          <div className="mt-5 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h2 className="font-bold text-blue-800 dark:text-blue-200 mb-3 text-base flex items-center gap-2">
              🎓 {copy.trainerInfo}
              {listing.trainerProfile.isVerified && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">✓ {copy.verified}</span>
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {listing.trainerProfile.hourlyRate != null && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center sm:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{copy.hourlyRate}</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {listing.trainerProfile.hourlyRate.toLocaleString("tr-TR")} ₺
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> {copy.perHour}</span>
                  </p>
                </div>
              )}
              {listing.trainerProfile.specializations?.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <span>🏅</span>
                  <span className="font-medium">{s.sportName}</span>
                  {s.years > 0 && <span className="text-sm text-blue-500 dark:text-blue-400">({s.years} {copy.years})</span>}
                </div>
              ))}
              {listing.trainerProfile.gymName && (
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 sm:col-span-2">
                  <span>🏢</span>
                  <span className="font-medium">{listing.trainerProfile.gymName}</span>
                </div>
              )}
              {listing.trainerProfile.gymAddress && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 sm:col-span-2">
                  <span>📍</span>
                  <span className="text-sm">{listing.trainerProfile.gymAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Spor Malzemesi Bilgileri ── */}
        {listing.type === "EQUIPMENT" && listing.equipmentDetail && (
          <div className="mt-5 p-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <h2 className="font-bold text-purple-800 dark:text-purple-200 mb-3 text-base">🛒 {copy.productDetails}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{copy.price}</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                  {listing.equipmentDetail.price.toLocaleString("tr-TR")} ₺
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{copy.condition}</p>
                <p className="font-semibold text-purple-700 dark:text-purple-300">
                  {listing.equipmentDetail.condition === "NEW" ? copy.condNew
                    : listing.equipmentDetail.condition === "LIKE_NEW" ? copy.condLikeNew
                    : listing.equipmentDetail.condition === "GOOD" ? copy.condGood
                    : copy.condFair}
                </p>
              </div>
              {listing.equipmentDetail.brand && (
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <span>🏷️</span>
                  <span><span className="text-gray-500 dark:text-gray-400 text-sm">{copy.brand}: </span>{listing.equipmentDetail.brand}</span>
                </div>
              )}
              {listing.equipmentDetail.model && (
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <span>📋</span>
                  <span><span className="text-gray-500 dark:text-gray-400 text-sm">{copy.model}: </span>{listing.equipmentDetail.model}</span>
                </div>
              )}
            </div>
            {listing.equipmentDetail.images?.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {listing.equipmentDetail.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${copy.productImage} ${i + 1}`}
                    className="h-24 w-24 object-cover rounded-lg border border-purple-200 dark:border-purple-700"
                  />
                ))}
              </div>
            )}
            {listing.equipmentDetail.isSold && (
              <div className="mt-3 text-center text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg py-2">
                🔴 {copy.productSold}
              </div>
            )}
          </div>
        )}

        {listing.type === "VENUE_MEMBERSHIP" && listing.venueMembershipDetail && (
          <div className="mt-5 p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <h2 className="font-bold text-indigo-800 dark:text-indigo-200 mb-3 text-base">💳 {copy.membershipDetails}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-indigo-900 dark:text-indigo-100">
              <div>{copy.type}: <span className="font-semibold">{listing.venueMembershipDetail.membershipType}</span></div>
              <div>{copy.price}: <span className="font-semibold">{listing.venueMembershipDetail.price.toLocaleString("tr-TR")} ₺</span></div>
              {listing.venueMembershipDetail.maxMembers != null && <div>{copy.quota}: <span className="font-semibold">{listing.venueMembershipDetail.maxMembers}</span></div>}
              <div>{copy.trialPackage}: <span className="font-semibold">{listing.venueMembershipDetail.trialAvailable ? copy.trialYes : copy.trialNo}</span></div>
              {listing.venueMembershipDetail.trialPrice != null && <div>{copy.trialPrice}: <span className="font-semibold">{listing.venueMembershipDetail.trialPrice.toLocaleString("tr-TR")} ₺</span></div>}
            </div>
            {listing.venueMembershipDetail.includes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.venueMembershipDetail.includes.map((item) => (
                  <span key={item} className="rounded-full bg-white/80 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">{item}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {listing.type === "VENUE_CLASS" && listing.venueClassDetail && (
          <div className="mt-5 p-5 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl">
            <h2 className="font-bold text-pink-800 dark:text-pink-200 mb-3 text-base">📚 {copy.classDetails}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-pink-900 dark:text-pink-100">
              <div>{copy.className}: <span className="font-semibold">{listing.venueClassDetail.className}</span></div>
              {listing.venueClassDetail.instructorName && <div>{copy.instructor}: <span className="font-semibold">{listing.venueClassDetail.instructorName}</span></div>}
              {listing.venueClassDetail.schedule && <div>{copy.schedule}: <span className="font-semibold">{listing.venueClassDetail.schedule}</span></div>}
              {listing.venueClassDetail.difficulty && <div>{copy.difficulty}: <span className="font-semibold">{listing.venueClassDetail.difficulty}</span></div>}
              {listing.venueClassDetail.pricePerSession != null && <div>{copy.sessionPrice}: <span className="font-semibold">{listing.venueClassDetail.pricePerSession.toLocaleString("tr-TR")} ₺</span></div>}
              {listing.venueClassDetail.priceMonthly != null && <div>{copy.monthlyPrice}: <span className="font-semibold">{listing.venueClassDetail.priceMonthly.toLocaleString("tr-TR")} ₺</span></div>}
              {listing.venueClassDetail.maxParticipants != null && <div>{copy.quota}: <span className="font-semibold">{listing.venueClassDetail.maxParticipants}</span></div>}
            </div>
          </div>
        )}

        {listing.type === "VENUE_PRODUCT" && listing.venueProductDetail && (
          <div className="mt-5 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <h2 className="font-bold text-amber-800 dark:text-amber-200 mb-3 text-base">🛍️ {copy.venueProductDetails}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-amber-900 dark:text-amber-100">
              <div>{copy.product}: <span className="font-semibold">{listing.venueProductDetail.productName}</span></div>
              <div>{copy.category}: <span className="font-semibold">{listing.venueProductDetail.productCategory}</span></div>
              <div>{copy.price}: <span className="font-semibold">{listing.venueProductDetail.price.toLocaleString("tr-TR")} ₺</span></div>
              <div>{copy.unit}: <span className="font-semibold">{listing.venueProductDetail.unit}</span></div>
              {listing.venueProductDetail.brand && <div>{copy.brand}: <span className="font-semibold">{listing.venueProductDetail.brand}</span></div>}
              <div>{copy.stock}: <span className="font-semibold">{listing.venueProductDetail.inStock ? copy.inStock : copy.outOfStock}</span></div>
            </div>
          </div>
        )}

        {listing.type === "VENUE_SERVICE" && listing.venueServiceDetail && (
          <div className="mt-5 p-5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl">
            <h2 className="font-bold text-cyan-800 dark:text-cyan-200 mb-3 text-base">🔧 {copy.serviceDetails}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-cyan-900 dark:text-cyan-100">
              <div>{copy.service}: <span className="font-semibold">{listing.venueServiceDetail.serviceType}</span></div>
              {listing.venueServiceDetail.pricePerSession != null && <div>{copy.price}: <span className="font-semibold">{listing.venueServiceDetail.pricePerSession.toLocaleString("tr-TR")} ₺</span></div>}
              {listing.venueServiceDetail.sessionDuration != null && <div>{copy.duration}: <span className="font-semibold">{listing.venueServiceDetail.sessionDuration} {copy.minutes}</span></div>}
            </div>
            {listing.venueServiceDetail.qualifications && (
              <div className="mt-3 rounded-lg bg-white/70 dark:bg-gray-800 p-3 text-sm text-cyan-900 dark:text-cyan-100">
                <p className="font-semibold mb-1">{copy.qualifications}</p>
                <p>{listing.venueServiceDetail.qualifications}</p>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Match bilgisi */}
      {isMatched && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-4">
          <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
            🎉 {copy.matchMade}
          </h3>

          {listing.maxParticipants > 2 ? (
            // Grup eşleşmesi: tüm kabul edilmiş katılımcıları göster
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* İlan sahibi */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">👑 {copy.listingOwner}</p>
                <Link href={`/profil/${listing.userId}`} className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-emerald-600 transition">
                  {listing.user?.name}
                </Link>
              </div>
              {/* Kabul edilen katılımcılar */}
              {listing.responses
                ?.filter((r: ListingResponse) => r.status === "ACCEPTED")
                .map((r: ListingResponse) => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">✅ {copy.participant}</p>
                    <Link href={`/profil/${r.userId}`} className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-emerald-600 transition">
                      {r.user?.name}
                    </Link>
                  </div>
                ))}
            </div>
          ) : listing.match ? (
            // 1v1 eşleşmesi
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{copy.listingOwner}</p>
                <Link href={`/profil/${listing.match.user1Id}`} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-emerald-600 transition">
                  {listing.match.user1?.name}
                </Link>
              </div>
              <div className="flex items-center justify-center text-2xl" aria-hidden="true">🤝</div>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{copy.matchedPerson}</p>
                <Link href={`/profil/${listing.match.user2Id}`} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-emerald-600 transition">
                  {listing.match.user2?.name}
                </Link>
              </div>
            </div>
          ) : null}
          {/* Post-match panel — only for participants after the event */}
          {isMatchParticipant && matchInPast && listing.match && (() => {
            const matchStatus = listing.match.status;
            const ratedUserId = listing.match.user1Id === currentUserId ? listing.match.user2Id : listing.match.user1Id;
            const alreadyRated = ratedThisSession || listing.match.ratings?.some((r) => r.ratedById === currentUserId);

            return (
              <div className="mt-4 border-t border-green-200 dark:border-green-700 pt-4 space-y-4">
                {/* Complete match CTA */}
                {matchStatus !== "COMPLETED" && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold mb-2">📅 {copy.matchPastTitle}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">{copy.matchPastDesc}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleCompleteMatch(listing.match!.id)} loading={completing} size="sm">
                        ✅ {copy.confirmMatch}
                      </Button>
                      <button
                        onClick={() => handleNoShow(listing.match!.id)}
                        disabled={noShowSending}
                        className="text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        {noShowSending ? copy.sending : `⚠️ ${copy.noShowReport}`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rating section */}
                {matchStatus === "COMPLETED" && !alreadyRated && !showRatingModal && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-300 font-semibold">🌟 {copy.matchDone}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">{copy.ratePartner}</p>
                    </div>
                    <Button onClick={() => setShowRatingModal(true)} size="sm">{copy.rateBtn}</Button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Karşılık gönder */}
      {canRespond && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">💬 {copy.respondTitle}</h3>
          <textarea
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-3"
            placeholder={copy.respondPlaceholder}
            aria-label={copy.respondTitle}
          />
          <Button onClick={handleSendResponse} loading={sending}>
            {copy.respondBtn}
          </Button>
        </div>
      )}

      {!session && !isMatched && !isClosed && (
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 mb-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {copy.signInPrompt}{" "}
            <Link href="/auth/giris" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              {copy.signInLink}
            </Link>{" "}
            {copy.signInSuffix}
          </p>
        </div>
      )}

      {hasResponded && !isOwner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 text-center">
          <p className="text-blue-700 dark:text-blue-300">✅ {copy.alreadyResponded}</p>
        </div>
      )}

      {!isOwner && !isMatched && !isClosed && !hasResponded && isCapacityFull && session && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-4 text-center">
          <p className="text-amber-700 dark:text-amber-400 font-medium italic">⚠️ {copy.capacityFull}</p>
        </div>
      )}

      {/* İlan sahibi için gelen karşılıklar */}
      {isOwner && listing.responses && listing.responses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            📩 {copy.incomingResponses} ({listing.responses.length})
          </h3>
          <div className="space-y-3">
            {listing.responses.map((resp: ListingResponse) => (
              <div key={resp.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Link href={`/profil/${resp.userId}`} className="font-medium text-gray-800 dark:text-gray-100 hover:text-emerald-600 transition">
                      {resp.user?.name}
                    </Link>
                    <span className="ml-2 text-xs text-gray-400">
                      {format(new Date(resp.createdAt), "d MMM HH:mm", { locale: dateFnsLocale })}
                    </span>
                  </div>
                  <Badge
                    variant={resp.status === "PENDING" ? "yellow" : resp.status === "ACCEPTED" ? "green" : "red"}
                  >
                    {STATUS_LABELS[resp.status]?.label || resp.status}
                  </Badge>
                </div>
                {resp.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{resp.message}</p>
                )}
                {resp.status === "PENDING" && listing.status === "OPEN" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleResponseAction(resp.id, "accept")} loading={actionLoading === resp.id} disabled={actionLoading !== null}>
                      ✅ {copy.accept}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleResponseAction(resp.id, "reject")} loading={actionLoading === resp.id} disabled={actionLoading !== null}>
                      ❌ {copy.reject}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benzer İlanlar */}
      {similar.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔍 {copy.similarListings}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {similar.map(s => (
              <ListingCard key={s.id} listing={s} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title={copy.deleteTitle}
        description={copy.deleteDesc}
        confirmText={copy.deleteConfirm}
        variant="danger"
        loading={deleting}
      />
      <Modal
        open={closeModal}
        onClose={() => setCloseModal(false)}
        onConfirm={handleClose}
        title={copy.closeTitle}
        description={copy.closeDesc}
        confirmText={copy.closeConfirm}
        variant="primary"
        loading={closing}
      />

      {/* Şikayet Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">🚩 {copy.reportTitle}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{copy.reportReason}</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{copy.reportDescLabel}</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={copy.reportDescPlaceholder}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setReportModal(false)}>{copy.cancelBtn}</Button>
                <Button onClick={handleReportUser} loading={reportLoading} className="bg-orange-600 hover:bg-orange-700 text-white">{copy.sendBtn}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
