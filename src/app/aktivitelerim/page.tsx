"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { useLocale } from "next-intl";
import toast from "@/lib/toast";
import { getDateFnsLocale, localizeListingType, localizeSportName, resolveAppLocale } from "@/lib/localized-ui";

// ─── Tipler ────────────────────────────────────────────────────────────────────
type SportSnip     = { id: string; name: string; icon: string | null };
type DistrictSnip  = { name: string; city: { name: string } } | null;
type UserSnip      = { id: string; name: string; avatarUrl: string | null };

type MyListing = {
  id: string; type: string; status: string;
  dateTime: string; createdAt: string;
  sport: SportSnip; district: DistrictSnip;
  responses?: { id: string; message: string | null; user: UserSnip }[];
  _count: { responses: number };
};

type MyResponse = {
  id: string; status: string; message: string | null; createdAt: string;
  listing: {
    id: string; type: string; status: string; dateTime: string;
    sport: SportSnip; district: DistrictSnip; user: UserSnip;
  };
};

type MyMatch = {
  id: string; status: string;
  scheduledAt: string | null; completedAt: string | null;
  trustScore: number; approvedById: string | null;
  iHaveConfirmed: boolean; iHaveRated: boolean;
  iHaveReported?: boolean;
  createdAt: string;
  user1: UserSnip; user2: UserSnip;
  user1Id?: string; user2Id?: string;
  listing: {
    id: string; type: string; dateTime: string;
    sport: SportSnip; district: DistrictSnip;
  } | null;
  _count: { messages: number };
};

type Challenge = {
  id: string; challengeType: "RIVAL" | "PARTNER";
  message: string | null; proposedDateTime: string | null;
  status: string; createdAt: string; expiresAt: string;
  challenger: UserSnip & { userLevel: string | null };
  target: UserSnip & { userLevel: string | null };
  sport: SportSnip;
  district: { name: string; city: { name: string } } | null;
};

// ─── Yardımcı badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  OPEN:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  MATCHED:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CLOSED:    "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ONGOING:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  PENDING:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  ACCEPTED:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};
const STATUS_LABELS: Record<string, Record<string, string>> = {
  tr: {
    OPEN: "Açık", MATCHED: "Eşleşti", CLOSED: "Kapandı", CANCELLED: "İptal",
    SCHEDULED: "Planlandı", ONGOING: "Devam Ediyor", COMPLETED: "Tamamlandı",
    PENDING: "Bekliyor", ACCEPTED: "Kabul Edildi", REJECTED: "Reddedildi",
  },
  en: {
    OPEN: "Open", MATCHED: "Matched", CLOSED: "Closed", CANCELLED: "Cancelled",
    SCHEDULED: "Scheduled", ONGOING: "Ongoing", COMPLETED: "Completed",
    PENDING: "Pending", ACCEPTED: "Accepted", REJECTED: "Rejected",
  },
  ru: {
    OPEN: "Открыто", MATCHED: "Есть матч", CLOSED: "Закрыто", CANCELLED: "Отменено",
    SCHEDULED: "Запланировано", ONGOING: "Идет", COMPLETED: "Завершено",
    PENDING: "Ожидает", ACCEPTED: "Принято", REJECTED: "Отклонено",
  },
  de: {
    OPEN: "Offen", MATCHED: "Zugeordnet", CLOSED: "Geschlossen", CANCELLED: "Abgesagt",
    SCHEDULED: "Geplant", ONGOING: "Laufend", COMPLETED: "Abgeschlossen",
    PENDING: "Ausstehend", ACCEPTED: "Akzeptiert", REJECTED: "Abgelehnt",
  },
  fr: {
    OPEN: "Ouvert", MATCHED: "Apparié", CLOSED: "Fermé", CANCELLED: "Annulé",
    SCHEDULED: "Planifié", ONGOING: "En cours", COMPLETED: "Terminé",
    PENDING: "En attente", ACCEPTED: "Accepté", REJECTED: "Refusé",
  },
  es: {
    OPEN: "Abierto", MATCHED: "Emparejado", CLOSED: "Cerrado", CANCELLED: "Cancelado",
    SCHEDULED: "Programado", ONGOING: "En curso", COMPLETED: "Completado",
    PENDING: "Pendiente", ACCEPTED: "Aceptado", REJECTED: "Rechazado",
  },
  ja: {
    OPEN: "募集中", MATCHED: "マッチ済", CLOSED: "終了", CANCELLED: "キャンセル",
    SCHEDULED: "予定", ONGOING: "進行中", COMPLETED: "完了",
    PENDING: "保留", ACCEPTED: "承認済", REJECTED: "却下",
  },
  ko: {
    OPEN: "모집중", MATCHED: "매칭됨", CLOSED: "마감", CANCELLED: "취소됨",
    SCHEDULED: "예정됨", ONGOING: "진행중", COMPLETED: "완료",
    PENDING: "대기중", ACCEPTED: "수락됨", REJECTED: "거절됨",
  },
};
const PAGE_COPY = {
  tr: {
    title: "Aktivitelerim",
    subtitle: "İlanlarını, başvurularını, eşleşmelerini ve tekliflerini tek yerden yönet.",
    tabMatches: "Eşleşmeler",
    tabListings: "İlanlarım",
    tabResponses: "Başvurularım",
    tabChallenges: "Teklifler",
    noMatches: "Henüz eşleşmen yok.",
    noListings: "Henüz ilan açmadın.",
    noResponses: "Henüz bir ilana başvurmadın.",
    noChallenges: "Bekleyen teklif yok.",
    loadFailed: "Veriler yüklenemedi",
    confirmCloseListing: "Bu ilanı kapatmak istediğinize emin misiniz? Bekleyen başvurular reddedilecek.",
    listingClosed: "İlan kapatıldı",
    actionFailed: "İşlem başarısız",
    genericError: "Bir hata oluştu",
    responseAccepted: "✅ Başvuru kabul edildi!",
    responseRejected: "Başvuru reddedildi",
    matchApproved: "✅ Maç onaylandı!",
    reportForwarded: "⚠️ Bildirim iletildi.",
    challengeAccepted: "✅ Teklif kabul edildi!",
    challengeRejected: "Teklif reddedildi",
    approvalNeeded: "⚡ Onay gerekli",
    messages: "mesaj",
    expiredMatchPrompt: "Maç tarihi geçti. Maç gerçekleştiyse lütfen onaylayın, aksi halde bildirin.",
    approveMatch: "✅ Maçı Onayla",
    reportNoShow: "🚫 Gelmedi Olarak Bildir",
    reportSent: "Rapor iletildi.",
    newListing: "+ Yeni İlan",
    applications: "başvuru",
    detailsApplications: "📋 Detay / Başvurular",
    closeListing: "🔒 İlanı Kapat",
    pendingResponses: "⚠️ Bekleyen Karşılıklar",
    accept: "Kabul",
    reject: "Red",
    incomingChallenges: "Gelen Teklifler",
    outgoingChallenges: "Gönderilen Teklifler",
    ratePartner: "⭐ Puan ver",
  },
  en: {
    title: "My Activities",
    subtitle: "Manage your listings, responses, matches, and challenges in one place.",
    tabMatches: "Matches",
    tabListings: "My Listings",
    tabResponses: "My Responses",
    tabChallenges: "Challenges",
    noMatches: "You have no matches yet.",
    noListings: "You have not created a listing yet.",
    noResponses: "You have not responded to a listing yet.",
    noChallenges: "No pending challenges.",
    loadFailed: "Could not load data",
    confirmCloseListing: "Are you sure you want to close this listing? Pending responses will be rejected.",
    listingClosed: "Listing closed",
    actionFailed: "Action failed",
    genericError: "Something went wrong",
    responseAccepted: "✅ Response accepted!",
    responseRejected: "Response rejected",
    matchApproved: "✅ Match approved!",
    reportForwarded: "⚠️ Report submitted.",
    challengeAccepted: "✅ Challenge accepted!",
    challengeRejected: "Challenge rejected",
    approvalNeeded: "⚡ Approval required",
    messages: "messages",
    expiredMatchPrompt: "The match date has passed. Please approve if the match happened, otherwise report it.",
    approveMatch: "✅ Approve Match",
    reportNoShow: "🚫 Report No-Show",
    reportSent: "Report submitted.",
    newListing: "+ New Listing",
    applications: "responses",
    detailsApplications: "📋 Details / Responses",
    closeListing: "🔒 Close Listing",
    pendingResponses: "⚠️ Pending Responses",
    accept: "Accept",
    reject: "Reject",
    incomingChallenges: "Incoming Challenges",
    outgoingChallenges: "Outgoing Challenges",
    ratePartner: "⭐ Rate",
  },
  ru: {
    title: "Мои активности",
    subtitle: "Управляйте объявлениями, откликами, матчами и вызовами в одном месте.",
    tabMatches: "Матчи",
    tabListings: "Мои объявления",
    tabResponses: "Мои отклики",
    tabChallenges: "Вызовы",
    noMatches: "У вас пока нет матчей.",
    noListings: "Вы еще не создали объявление.",
    noResponses: "Вы еще не откликались на объявления.",
    noChallenges: "Нет ожидающих вызовов.",
    loadFailed: "Не удалось загрузить данные",
    confirmCloseListing: "Закрыть это объявление? Ожидающие отклики будут отклонены.",
    listingClosed: "Объявление закрыто",
    actionFailed: "Не удалось выполнить действие",
    genericError: "Произошла ошибка",
    responseAccepted: "✅ Отклик принят!",
    responseRejected: "Отклик отклонен",
    matchApproved: "✅ Матч подтвержден!",
    reportForwarded: "⚠️ Жалоба отправлена.",
    challengeAccepted: "✅ Вызов принят!",
    challengeRejected: "Вызов отклонен",
    approvalNeeded: "⚡ Требуется подтверждение",
    messages: "сообщений",
    expiredMatchPrompt: "Дата матча прошла. Если матч состоялся, подтвердите, иначе отправьте жалобу.",
    approveMatch: "✅ Подтвердить матч",
    reportNoShow: "🚫 Сообщить о неявке",
    reportSent: "Жалоба отправлена.",
    newListing: "+ Новое объявление",
    applications: "откликов",
    detailsApplications: "📋 Детали / Отклики",
    closeListing: "🔒 Закрыть объявление",
    pendingResponses: "⚠️ Ожидающие отклики",
    accept: "Принять",
    reject: "Отклонить",
    incomingChallenges: "Входящие вызовы",
    outgoingChallenges: "Исходящие вызовы",
    ratePartner: "⭐ Оценить",
  },
  de: {
    title: "Meine Aktivitäten",
    subtitle: "Verwalte deine Anzeigen, Bewerbungen, Matches und Herausforderungen an einem Ort.",
    tabMatches: "Matches",
    tabListings: "Meine Anzeigen",
    tabResponses: "Meine Bewerbungen",
    tabChallenges: "Herausforderungen",
    noMatches: "Noch keine Matches.",
    noListings: "Du hast noch keine Anzeige erstellt.",
    noResponses: "Du hast noch auf keine Anzeige geantwortet.",
    noChallenges: "Keine ausstehenden Herausforderungen.",
    loadFailed: "Daten konnten nicht geladen werden",
    confirmCloseListing: "Anzeige schließen? Ausstehende Bewerbungen werden abgelehnt.",
    listingClosed: "Anzeige geschlossen",
    actionFailed: "Aktion fehlgeschlagen",
    genericError: "Ein Fehler ist aufgetreten",
    responseAccepted: "✅ Bewerbung angenommen!",
    responseRejected: "Bewerbung abgelehnt",
    matchApproved: "✅ Match bestätigt!",
    reportForwarded: "⚠️ Meldung gesendet.",
    challengeAccepted: "✅ Herausforderung angenommen!",
    challengeRejected: "Herausforderung abgelehnt",
    approvalNeeded: "⚡ Bestätigung erforderlich",
    messages: "Nachrichten",
    expiredMatchPrompt: "Das Match-Datum ist abgelaufen. Bitte bestätigen oder melden.",
    approveMatch: "✅ Match bestätigen",
    reportNoShow: "🚫 Nichterscheinen melden",
    reportSent: "Meldung gesendet.",
    newListing: "+ Neue Anzeige",
    applications: "Bewerbungen",
    detailsApplications: "📋 Details / Bewerbungen",
    closeListing: "🔒 Anzeige schließen",
    pendingResponses: "⚠️ Ausstehende Antworten",
    accept: "Annehmen",
    reject: "Ablehnen",
    incomingChallenges: "Eingehende Herausforderungen",
    outgoingChallenges: "Gesendete Herausforderungen",
    ratePartner: "⭐ Bewerten",
  },
  fr: {
    title: "Mes activités",
    subtitle: "Gérez vos annonces, candidatures, matchs et défis en un seul endroit.",
    tabMatches: "Matchs",
    tabListings: "Mes annonces",
    tabResponses: "Mes candidatures",
    tabChallenges: "Défis",
    noMatches: "Aucun match pour le moment.",
    noListings: "Vous n'avez pas encore créé d'annonce.",
    noResponses: "Vous n'avez pas encore postulé.",
    noChallenges: "Aucun défi en attente.",
    loadFailed: "Impossible de charger les données",
    confirmCloseListing: "Fermer cette annonce ? Les candidatures en attente seront refusées.",
    listingClosed: "Annonce fermée",
    actionFailed: "Action échouée",
    genericError: "Une erreur est survenue",
    responseAccepted: "✅ Candidature acceptée !",
    responseRejected: "Candidature refusée",
    matchApproved: "✅ Match confirmé !",
    reportForwarded: "⚠️ Signalement envoyé.",
    challengeAccepted: "✅ Défi accepté !",
    challengeRejected: "Défi refusé",
    approvalNeeded: "⚡ Confirmation requise",
    messages: "messages",
    expiredMatchPrompt: "La date du match est passée. Veuillez confirmer ou signaler.",
    approveMatch: "✅ Confirmer le match",
    reportNoShow: "🚫 Signaler une absence",
    reportSent: "Signalement envoyé.",
    newListing: "+ Nouvelle annonce",
    applications: "candidatures",
    detailsApplications: "📋 Détails / Candidatures",
    closeListing: "🔒 Fermer l'annonce",
    pendingResponses: "⚠️ Réponses en attente",
    accept: "Accepter",
    reject: "Refuser",
    incomingChallenges: "Défis reçus",
    outgoingChallenges: "Défis envoyés",
    ratePartner: "⭐ Noter",
  },
  es: {
    title: "Mis actividades",
    subtitle: "Gestiona tus anuncios, solicitudes, partidos y desafíos en un solo lugar.",
    tabMatches: "Partidos",
    tabListings: "Mis anuncios",
    tabResponses: "Mis solicitudes",
    tabChallenges: "Desafíos",
    noMatches: "Aún no tienes partidos.",
    noListings: "Aún no has creado un anuncio.",
    noResponses: "Aún no has respondido a un anuncio.",
    noChallenges: "No hay desafíos pendientes.",
    loadFailed: "No se pudieron cargar los datos",
    confirmCloseListing: "¿Cerrar este anuncio? Las solicitudes pendientes serán rechazadas.",
    listingClosed: "Anuncio cerrado",
    actionFailed: "Acción fallida",
    genericError: "Algo salió mal",
    responseAccepted: "✅ ¡Solicitud aceptada!",
    responseRejected: "Solicitud rechazada",
    matchApproved: "✅ ¡Partido confirmado!",
    reportForwarded: "⚠️ Reporte enviado.",
    challengeAccepted: "✅ ¡Desafío aceptado!",
    challengeRejected: "Desafío rechazado",
    approvalNeeded: "⚡ Confirmación requerida",
    messages: "mensajes",
    expiredMatchPrompt: "La fecha del partido ha pasado. Confirma o reporta.",
    approveMatch: "✅ Confirmar partido",
    reportNoShow: "🚫 Reportar ausencia",
    reportSent: "Reporte enviado.",
    newListing: "+ Nuevo anuncio",
    applications: "solicitudes",
    detailsApplications: "📋 Detalles / Solicitudes",
    closeListing: "🔒 Cerrar anuncio",
    pendingResponses: "⚠️ Respuestas pendientes",
    accept: "Aceptar",
    reject: "Rechazar",
    incomingChallenges: "Desafíos recibidos",
    outgoingChallenges: "Desafíos enviados",
    ratePartner: "⭐ Calificar",
  },
  ja: {
    title: "マイアクティビティ",
    subtitle: "募集、応募、マッチ、チャレンジを一元管理。",
    tabMatches: "マッチ",
    tabListings: "マイ募集",
    tabResponses: "マイ応募",
    tabChallenges: "チャレンジ",
    noMatches: "まだマッチはありません。",
    noListings: "まだ募集を作成していません。",
    noResponses: "まだ応募していません。",
    noChallenges: "保留中のチャレンジはありません。",
    loadFailed: "データを読み込めませんでした",
    confirmCloseListing: "この募集を閉じますか？保留中の応募は却下されます。",
    listingClosed: "募集を閉じました",
    actionFailed: "操作に失敗しました",
    genericError: "エラーが発生しました",
    responseAccepted: "✅ 応募を承認しました！",
    responseRejected: "応募を却下しました",
    matchApproved: "✅ マッチを承認しました！",
    reportForwarded: "⚠️ 報告を送信しました。",
    challengeAccepted: "✅ チャレンジを承認しました！",
    challengeRejected: "チャレンジを却下しました",
    approvalNeeded: "⚡ 確認が必要です",
    messages: "メッセージ",
    expiredMatchPrompt: "マッチ日が過ぎました。実施済みなら承認、そうでなければ報告してください。",
    approveMatch: "✅ マッチを承認",
    reportNoShow: "🚫 不参加を報告",
    reportSent: "報告を送信しました。",
    newListing: "+ 新規募集",
    applications: "応募",
    detailsApplications: "📋 詳細 / 応募",
    closeListing: "🔒 募集を閉じる",
    pendingResponses: "⚠️ 保留中の応答",
    accept: "承認",
    reject: "却下",
    incomingChallenges: "受信チャレンジ",
    outgoingChallenges: "送信チャレンジ",
    ratePartner: "⭐ 評価",
  },
  ko: {
    title: "내 활동",
    subtitle: "게시물, 지원, 매치 및 도전을 한 곳에서 관리하세요.",
    tabMatches: "매치",
    tabListings: "내 게시물",
    tabResponses: "내 지원",
    tabChallenges: "도전",
    noMatches: "아직 매치가 없습니다.",
    noListings: "아직 게시물을 만들지 않았습니다.",
    noResponses: "아직 지원하지 않았습니다.",
    noChallenges: "대기 중인 도전이 없습니다.",
    loadFailed: "데이터를 불러올 수 없습니다",
    confirmCloseListing: "이 게시물을 닫으시겠습니까? 대기 중인 지원은 거절됩니다.",
    listingClosed: "게시물이 닫혔습니다",
    actionFailed: "작업 실패",
    genericError: "오류가 발생했습니다",
    responseAccepted: "✅ 지원이 수락되었습니다!",
    responseRejected: "지원이 거절되었습니다",
    matchApproved: "✅ 매치가 승인되었습니다!",
    reportForwarded: "⚠️ 신고가 전송되었습니다.",
    challengeAccepted: "✅ 도전이 수락되었습니다!",
    challengeRejected: "도전이 거절되었습니다",
    approvalNeeded: "⚡ 확인 필요",
    messages: "메시지",
    expiredMatchPrompt: "매치 날짜가 지났습니다. 진행되었다면 승인하고, 아니면 신고해주세요.",
    approveMatch: "✅ 매치 승인",
    reportNoShow: "🚫 불참 신고",
    reportSent: "신고가 전송되었습니다.",
    newListing: "+ 새 게시물",
    applications: "지원",
    detailsApplications: "📋 상세 / 지원",
    closeListing: "🔒 게시물 닫기",
    pendingResponses: "⚠️ 대기 중인 응답",
    accept: "수락",
    reject: "거절",
    incomingChallenges: "받은 도전",
    outgoingChallenges: "보낸 도전",
    ratePartner: "⭐ 평가",
  },
} as const;

function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const labelMap = STATUS_LABELS[locale] ?? STATUS_LABELS.en;
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labelMap[status] ?? status}
    </span>
  );
}

function Avatar({ user }: { user: UserSnip }) {
  return (
    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 overflow-hidden shrink-0 border border-emerald-200 dark:border-emerald-700">
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        : user.name?.[0]?.toUpperCase()}
    </div>
  );
}

// ─── Sayfa ──────────────────────────────────────────────────────────────────────
type TabKey = "listings" | "responses" | "matches" | "challenges";

export default function AktivitelerimPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const safeLocale = resolveAppLocale(locale);
  const uiLocale = safeLocale;
  const dateLocale = getDateFnsLocale(locale);
  const copy = PAGE_COPY[uiLocale as keyof typeof PAGE_COPY] ?? PAGE_COPY.en;

  const tabParam = ((searchParams?.get("tab") ?? "") as TabKey) || "matches";
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam);

  const [listings, setListings]   = useState<MyListing[]>([]);
  const [responses, setResponses] = useState<MyResponse[]>([]);
  const [matches, setMatches]     = useState<MyMatch[]>([]);
  const [challenges, setChallenges] = useState<{ received: Challenge[]; sent: Challenge[] }>({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/giris");
  }, [authStatus, router]);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [aktRes, recRes, sentRes] = await Promise.all([
        fetch("/api/aktivitelerim").then((r) => r.json()),
        fetch("/api/challenges?direction=received").then((r) => r.json()),
        fetch("/api/challenges?direction=sent").then((r) => r.json()),
      ]);
      if (aktRes.success) {
        setListings(aktRes.data.listings ?? []);
        setResponses(aktRes.data.responses ?? []);
        setMatches(aktRes.data.matches ?? []);
      }
      setChallenges({
        received: recRes.success ? recRes.data ?? [] : [],
        sent:     sentRes.success ? sentRes.data ?? [] : [],
      });
    } catch {
      toast.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const handleCloseListing = async (id: string) => {
    if (!confirm(copy.confirmCloseListing)) return;
    setClosingId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(copy.listingClosed);
        setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "CLOSED" } : l));
      } else {
        toast.error(json.error ?? copy.actionFailed);
      }
    } catch {
      toast.error(copy.genericError);
    } finally {
      setClosingId(null);
    }
  };

  const [answeringResponse, setAnsweringResponse] = useState<string | null>(null);
  const handleResponseAction = async (id: string, action: "accept" | "reject", listingId: string) => {
    setAnsweringResponse(id);
    try {
      const res = await fetch(`/api/responses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === "accept" ? copy.responseAccepted : copy.responseRejected);
        if (action === "accept") {
          // İlanın durumunu ve başvuruları güncelle
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: "MATCHED", responses: [] } : l));
        } else {
          // Sadece o başvuruyu listeden çıkar
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, responses: l.responses?.filter(r => r.id !== id) } : l));
        }
      } else {
        toast.error(json.error ?? copy.actionFailed);
      }
    } catch {
      toast.error(copy.genericError);
    } finally {
      setAnsweringResponse(null);
    }
  };

  const [confirmingMatchId, setConfirmingMatchId] = useState<string | null>(null);
  const handleMatchAction = async (matchId: string, action: "approve" | "report_no_show") => {
    setConfirmingMatchId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === "approve" ? copy.matchApproved : copy.reportForwarded);
        setMatches(prev => prev.map(m => m.id === matchId ? { 
          ...m, 
          iHaveConfirmed: action === "approve", 
          iHaveReported: action === "report_no_show",
          status: json.data?.status ?? m.status 
        } : m));
      } else {
        toast.error(json.error ?? copy.actionFailed);
      }
    } catch {
      toast.error(copy.genericError);
    } finally {
      setConfirmingMatchId(null);
    }
  };

  const handleChallengeAction = async (id: string, action: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === "ACCEPTED" ? copy.challengeAccepted : copy.challengeRejected);
        setChallenges((prev) => ({
          ...prev,
          received: prev.received.filter((c) => c.id !== id),
        }));
      } else {
        toast.error(json.error ?? copy.actionFailed);
      }
    } catch {
      toast.error(copy.genericError);
    }
  };

  const setTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.replace(`/aktivitelerim?tab=${tab}`, { scroll: false });
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const pendingChallenges = challenges.received.length;
  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: "matches",    label: copy.tabMatches,   icon: "🤝", count: matches.filter((m) => m.status !== "COMPLETED").length },
    { key: "listings",   label: copy.tabListings,  icon: "📋", count: listings.filter((l) => l.status === "OPEN").length },
    { key: "responses",  label: copy.tabResponses, icon: "📩", count: responses.filter((r) => r.status === "PENDING").length },
    { key: "challenges", label: copy.tabChallenges,icon: "⚔️", count: pendingChallenges },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-6 px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{copy.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <span className="hidden sm:inline">{tab.icon}</span>
            <span className="truncate">{tab.label}</span>
            {(tab.count ?? 0) > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                {tab.count! > 9 ? "9+" : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Eşleşmeler ──────────────────────────────────────────────────── */}
      {activeTab === "matches" && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <EmptyState icon="🤝" text={copy.noMatches} />
          ) : (
            matches.map((m) => {
              const opponent = m.user1.id === session?.user?.id ? m.user2 : m.user1;
              const matchDate = m.listing?.dateTime ?? m.scheduledAt;
              const needsAction = !m.iHaveConfirmed && m.status !== "COMPLETED" && m.status !== "CANCELLED" && matchDate && new Date(matchDate) < new Date();
              const needsRating = m.status === "COMPLETED" && !m.iHaveRated;
              return (
                <Link key={m.id} href={`/eslesmeler/${m.id}`} className="block">
                  <div className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 hover:shadow-md transition ${needsAction || needsRating ? "border-amber-200 dark:border-amber-700" : "border-gray-100 dark:border-gray-700"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={opponent} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{opponent.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{m.listing?.sport.icon} {m.listing?.sport.name ? localizeSportName(m.listing.sport.name, locale) : ""}</span>
                          </div>
                          {matchDate && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              📅 {format(new Date(matchDate), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                            </p>
                          )}
                          {m.listing?.district && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              📍 {m.listing.district.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={m.status} locale={uiLocale} />
                        {needsAction && <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{copy.approvalNeeded}</span>}
                        {needsRating && <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{copy.ratePartner}</span>}
                      </div>
                    </div>
                    {m._count.messages > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">💬 {m._count.messages} {copy.messages}</p>
                    )}
                    
                    {needsAction && !m.iHaveReported && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/50 rounded-xl space-y-3">
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                          {copy.expiredMatchPrompt}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.preventDefault(); handleMatchAction(m.id, "approve"); }}
                            disabled={confirmingMatchId === m.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-2 rounded-lg transition"
                          >
                            {copy.approveMatch}
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); handleMatchAction(m.id, "report_no_show"); }}
                            disabled={confirmingMatchId === m.id}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 text-[10px] font-bold py-2 rounded-lg transition"
                          >
                            {copy.reportNoShow}
                          </button>
                        </div>
                      </div>
                    )}
                    {m.iHaveReported && (
                      <div className="mt-3 text-center p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium italic">{copy.reportSent}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* ─── İlanlarım ───────────────────────────────────────────────────── */}
      {activeTab === "listings" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link href="/ilan/olustur" className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
              {copy.newListing}
            </Link>
          </div>
          {listings.length === 0 ? (
            <EmptyState icon="📋" text={copy.noListings} />
          ) : (
            listings.map((l) => (
              <div key={l.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {l.sport.icon} {localizeSportName(l.sport.name, locale)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{localizeListingType(l.type, locale)}</span>
                    </div>
                    {l.district && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">📍 {l.district.name}, {l.district.city.name}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      📅 {format(new Date(l.dateTime), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      📩 {l._count.responses} {copy.applications}
                    </p>
                  </div>
                  <StatusBadge status={l.status} locale={uiLocale} />
                </div>
                <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    href={`/ilan/${l.id}`}
                    className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition"
                  >
                    {copy.detailsApplications}
                  </Link>
                  {l.status === "OPEN" && (
                    <button
                      disabled={closingId === l.id}
                      onClick={() => handleCloseListing(l.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition disabled:opacity-50"
                    >
                      {closingId === l.id
                        ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        : copy.closeListing}
                    </button>
                  )}
                </div>

                {/* Gelen Başvurular (İlan Sahibine Özel) */}
                {l.status === "OPEN" && l.responses && l.responses.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <h4 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">{copy.pendingResponses} ({l.responses.length})</h4>
                    <div className="space-y-3">
                      {l.responses.map((resp) => (
                        <div key={resp.id} className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <Link href={`/profil/${resp.user.id}`} className="flex items-center gap-2 group">
                              <Avatar user={resp.user} />
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition">{resp.user.name}</span>
                            </Link>
                            <div className="flex gap-1">
                              <button
                                disabled={answeringResponse === resp.id}
                                onClick={() => handleResponseAction(resp.id, "accept", l.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition"
                              >
                                {answeringResponse === resp.id ? "..." : copy.accept}
                              </button>
                              <button
                                disabled={answeringResponse === resp.id}
                                onClick={() => handleResponseAction(resp.id, "reject", l.id)}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 text-[10px] font-bold rounded-lg transition"
                              >
                                {copy.reject}
                              </button>
                            </div>
                          </div>
                          {resp.message && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-100 dark:border-gray-700">
                              &ldquo;{resp.message}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Başvurularım ─────────────────────────────────────────────────── */}
      {activeTab === "responses" && (
        <div className="space-y-3">
          {responses.length === 0 ? (
            <EmptyState icon="📩" text={copy.noResponses} />
          ) : (
            responses.map((r) => (
              <Link key={r.id} href={`/ilan/${r.listing.id}`} className="block">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={r.listing.user} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                            {r.listing.sport.icon} {localizeSportName(r.listing.sport.name, locale)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{r.listing.user.name}</span>
                        </div>
                        {r.listing.district && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">📍 {r.listing.district.name}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          📅 {format(new Date(r.listing.dateTime), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                        </p>
                        {r.message && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate">&ldquo;{r.message}&rdquo;</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={r.status} locale={uiLocale} />
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {formatDistanceToNow(new Date(r.createdAt), { locale: dateLocale, addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ─── Teklifler ─────────────────────────────────────────────────────── */}
      {activeTab === "challenges" && (
        <div className="space-y-4">
          {/* Gelen teklifler */}
          {challenges.received.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                📥 {copy.incomingChallenges} ({challenges.received.length})
              </h2>
              <div className="space-y-3">
                {challenges.received.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} direction="received" onAction={handleChallengeAction} uiLocale={uiLocale} locale={locale} dateLocale={dateLocale} />
                ))}
              </div>
            </div>
          )}

          {/* Gönderilen teklifler */}
          {challenges.sent.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                📤 {copy.outgoingChallenges} ({challenges.sent.length})
              </h2>
              <div className="space-y-3">
                {challenges.sent.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} direction="sent" onAction={handleChallengeAction} uiLocale={uiLocale} locale={locale} dateLocale={dateLocale} />
                ))}
              </div>
            </div>
          )}

          {challenges.received.length === 0 && challenges.sent.length === 0 && (
            <EmptyState icon="⚔️" text={copy.noChallenges} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Alt Bileşenler ────────────────────────────────────────────────────────────
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <span className="text-4xl">{icon}</span>
      <p className="text-gray-400 dark:text-gray-500 text-sm">{text}</p>
    </div>
  );
}

function ChallengeCard({
  challenge, direction, onAction, uiLocale, locale, dateLocale,
}: {
  challenge: Challenge;
  direction: "received" | "sent";
  onAction: (id: string, action: "ACCEPTED" | "REJECTED") => void;
  uiLocale: string;
  locale: string;
  dateLocale: ReturnType<typeof getDateFnsLocale>;
}) {
  const [loading, setLoading] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const other = direction === "received" ? challenge.challenger : challenge.target;
  const expiresAt = new Date(challenge.expiresAt);
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 6 * 60 * 60 * 1000;
  const CHALLENGE_TEXT: Record<string, { rival: string; partner: string; expires: string; accept: string; reject: string }> = {
    tr: { rival: "Rakip", partner: "Partner", expires: "sona eriyor", accept: "Kabul Et", reject: "Reddet" },
    en: { rival: "Rival", partner: "Partner", expires: "remaining", accept: "Accept", reject: "Reject" },
    ru: { rival: "Соперник", partner: "Партнер", expires: "до конца", accept: "Принять", reject: "Отклонить" },
    de: { rival: "Gegner", partner: "Partner", expires: "verbleibend", accept: "Annehmen", reject: "Ablehnen" },
    fr: { rival: "Adversaire", partner: "Partenaire", expires: "restant", accept: "Accepter", reject: "Refuser" },
    es: { rival: "Rival", partner: "Compañero", expires: "restante", accept: "Aceptar", reject: "Rechazar" },
    ja: { rival: "ライバル", partner: "パートナー", expires: "残り", accept: "承認", reject: "却下" },
    ko: { rival: "상대", partner: "파트너", expires: "남음", accept: "수락", reject: "거절" },
  };
  const text = CHALLENGE_TEXT[uiLocale] ?? CHALLENGE_TEXT.en;

  const handleAction = async (action: "ACCEPTED" | "REJECTED") => {
    setLoading(action);
    await onAction(challenge.id, action);
    setLoading(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar user={other} />
          <div className="min-w-0">
            <Link href={`/profil/${other.id}`} className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:underline">
              {other.name}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {challenge.sport.icon} {localizeSportName(challenge.sport.name, locale)}
              {challenge.district && ` · ${challenge.district.name}`}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
          challenge.challengeType === "RIVAL"
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        }`}>
          {challenge.challengeType === "RIVAL" ? `⚔️ ${text.rival}` : `🤝 ${text.partner}`}
        </span>
      </div>

      {challenge.message && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-1.5">
          &ldquo;{challenge.message}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs ${isExpiringSoon ? "text-red-500 font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
          ⏳ {formatDistanceToNow(expiresAt, { locale: dateLocale, addSuffix: true })} {text.expires}
        </span>
        {challenge.proposedDateTime && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            📅 {format(new Date(challenge.proposedDateTime), "d MMM HH:mm", { locale: dateLocale })}
          </span>
        )}
      </div>

      {direction === "received" && (
        <div className="flex gap-2">
          <button
            disabled={loading !== null}
            onClick={() => handleAction("ACCEPTED")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition"
          >
            {loading === "ACCEPTED"
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : `✅ ${text.accept}`}
          </button>
          <button
            disabled={loading !== null}
            onClick={() => handleAction("REJECTED")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-red-50 disabled:opacity-50 text-red-600 dark:bg-gray-700 dark:hover:bg-red-900/20 dark:text-red-400 text-sm font-semibold py-2 rounded-xl transition"
          >
            {loading === "REJECTED"
              ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              : `❌ ${text.reject}`}
          </button>
        </div>
      )}
    </div>
  );
}
