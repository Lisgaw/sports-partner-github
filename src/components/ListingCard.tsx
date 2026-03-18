"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, differenceInYears } from "date-fns";
import { tr, enUS, ru, de, fr, es, ja, ko } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { localizeSportName, resolveAppLocale } from "@/lib/localized-ui";
import { ListingSummary } from "@/types";

const CARD_TEXT = {
  tr: {
    expired: "Suresi doldu",
    left: "kaldi",
    urgent: "ACIL",
    anonymous: "Anonim",
    femaleOnly: "Yalnizca Kadinlar",
    maleOnly: "Yalnizca Erkekler",
    compatible: "uyumlu",
    matched: "Eslesti",
    matchedCompleted: "Eslesme Tamamlandi",
    closed: "Kapandi",
    expiredStatus: "Suresi Doldu",
    unspecified: "Belirtilmemis",
    male: "Erkek",
    female: "Kadin",
    responseTrainer: "basvuru",
    responseDefault: "yanit",
    group: "Grup",
    perHour: "/sa",
    detail: "Ilani Gor",
  },
  en: {
    expired: "Expired",
    left: "left",
    urgent: "Urgent",
    anonymous: "Anonymous",
    femaleOnly: "Women only",
    maleOnly: "Men only",
    compatible: "match",
    matched: "Matched",
    matchedCompleted: "Match Completed",
    closed: "Closed",
    expiredStatus: "Expired",
    unspecified: "Unspecified",
    male: "Male",
    female: "Female",
    responseTrainer: "applications",
    responseDefault: "responses",
    group: "Group",
    perHour: "/h",
    detail: "View Listing",
  },
  ru: {
    expired: "Истекло",
    left: "осталось",
    urgent: "СРОЧНО",
    anonymous: "Анонимно",
    femaleOnly: "Только для женщин",
    maleOnly: "Только для мужчин",
    compatible: "совпадение",
    matched: "Совпало",
    matchedCompleted: "Совпадение подтверждено",
    closed: "Закрыто",
    expiredStatus: "Истекло",
    unspecified: "Не указано",
    male: "Мужчина",
    female: "Женщина",
    responseTrainer: "заявок",
    responseDefault: "откликов",
    group: "Группа",
    perHour: "/ч",
    detail: "Открыть объявление",
  },
  de: {
    expired: "Abgelaufen",
    left: "ubrig",
    urgent: "DRINGEND",
    anonymous: "Anonym",
    femaleOnly: "Nur fur Frauen",
    maleOnly: "Nur fur Manner",
    compatible: "Treffer",
    matched: "Gematcht",
    matchedCompleted: "Match abgeschlossen",
    closed: "Geschlossen",
    expiredStatus: "Abgelaufen",
    unspecified: "Nicht angegeben",
    male: "Mannlich",
    female: "Weiblich",
    responseTrainer: "Bewerbungen",
    responseDefault: "Antworten",
    group: "Gruppe",
    perHour: "/Std",
    detail: "Inserat anzeigen",
  },
  fr: {
    expired: "Expire",
    left: "restant",
    urgent: "URGENT",
    anonymous: "Anonyme",
    femaleOnly: "Femmes uniquement",
    maleOnly: "Hommes uniquement",
    compatible: "compatibilite",
    matched: "Associe",
    matchedCompleted: "Mise en relation terminee",
    closed: "Ferme",
    expiredStatus: "Expire",
    unspecified: "Non precise",
    male: "Homme",
    female: "Femme",
    responseTrainer: "candidatures",
    responseDefault: "reponses",
    group: "Groupe",
    perHour: "/h",
    detail: "Voir l'annonce",
  },
  es: {
    expired: "Caducado",
    left: "restante",
    urgent: "URGENTE",
    anonymous: "Anonimo",
    femaleOnly: "Solo mujeres",
    maleOnly: "Solo hombres",
    compatible: "compatibilidad",
    matched: "Emparejado",
    matchedCompleted: "Emparejamiento completado",
    closed: "Cerrado",
    expiredStatus: "Caducado",
    unspecified: "Sin especificar",
    male: "Hombre",
    female: "Mujer",
    responseTrainer: "solicitudes",
    responseDefault: "respuestas",
    group: "Grupo",
    perHour: "/h",
    detail: "Ver anuncio",
  },
  ja: {
    expired: "期限切れ",
    left: "残り",
    urgent: "至急",
    anonymous: "匿名",
    femaleOnly: "女性のみ",
    maleOnly: "男性のみ",
    compatible: "一致",
    matched: "マッチ済み",
    matchedCompleted: "マッチ完了",
    closed: "終了",
    expiredStatus: "期限切れ",
    unspecified: "未設定",
    male: "男性",
    female: "女性",
    responseTrainer: "応募",
    responseDefault: "返信",
    group: "グループ",
    perHour: "/時",
    detail: "詳細を見る",
  },
  ko: {
    expired: "만료됨",
    left: "남음",
    urgent: "긴급",
    anonymous: "익명",
    femaleOnly: "여성만",
    maleOnly: "남성만",
    compatible: "매치",
    matched: "매칭됨",
    matchedCompleted: "매칭 완료",
    closed: "마감됨",
    expiredStatus: "만료됨",
    unspecified: "미설정",
    male: "남성",
    female: "여성",
    responseTrainer: "신청",
    responseDefault: "응답",
    group: "그룹",
    perHour: "/시간",
    detail: "상세보기",
  },
} as const;

// Acil ilan geri sayım
function UrgentCountdown({
  expiresAt,
  expiredText,
  leftText,
}: {
  expiresAt: string;
  expiredText: string;
  leftText: string;
}) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining(expiredText); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")} ${leftText}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt, expiredText, leftText]);
  return (
    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold tabular-nums">
      🔴 {remaining}
    </span>
  );
}

// ─── Tür bazlı görsel konfigürasyonu ─────────────────────────────────────────
const LISTING_TYPE_CONFIG = {
  RIVAL: {
    label: "🥊 Rakip",
    accentColor: "border-l-orange-500",
    badgeVariant: "orange" as const,
    badgeCls: "text-orange-600 dark:text-orange-400",
  },
  PARTNER: {
    label: "🤝 Partner",
    accentColor: "border-l-emerald-500",
    badgeVariant: "emerald" as const,
    badgeCls: "text-emerald-600 dark:text-emerald-400",
  },
  TRAINER: {
    label: "🎓 Eğitmen",
    accentColor: "border-l-blue-500",
    badgeVariant: "blue" as const,
    badgeCls: "text-blue-600 dark:text-blue-400",
  },
  EQUIPMENT: {
    label: "🛒 Satılık",
    accentColor: "border-l-purple-500",
    badgeVariant: "purple" as const,
    badgeCls: "text-purple-600 dark:text-purple-400",
  },
  VENUE_MEMBERSHIP: {
    label: "💳 Üyelik",
    accentColor: "border-l-indigo-500",
    badgeVariant: "blue" as const,
    badgeCls: "text-indigo-600 dark:text-indigo-400",
  },
  VENUE_CLASS: {
    label: "📚 Ders/Kurs",
    accentColor: "border-l-pink-500",
    badgeVariant: "orange" as const,
    badgeCls: "text-pink-600 dark:text-pink-400",
  },
  VENUE_PRODUCT: {
    label: "🛍️ Ürün",
    accentColor: "border-l-amber-500",
    badgeVariant: "orange" as const,
    badgeCls: "text-amber-600 dark:text-amber-400",
  },
  VENUE_SERVICE: {
    label: "🔧 Hizmet",
    accentColor: "border-l-cyan-500",
    badgeVariant: "blue" as const,
    badgeCls: "text-cyan-600 dark:text-cyan-400",
  },
} as const;

const GENDER_ICONS: Record<string, string> = {
  MALE: "♂️",
  FEMALE: "♀️",
  PREFER_NOT_TO_SAY: "👤",
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  INTERMEDIATE: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
  ADVANCED: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

type ListingCardProps = {
  listing: ListingSummary;
};

export default function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const safeLocale = resolveAppLocale(locale);
  const dateLocale =
    locale === "tr" ? tr :
    locale === "ru" ? ru :
    locale === "de" ? de :
    locale === "fr" ? fr :
    locale === "es" ? es :
    locale === "ja" ? ja :
    locale === "ko" ? ko : enUS;

  const text = CARD_TEXT[safeLocale];

  const statusLabels: Record<string, { label: string; className: string }> = {
    MATCHED: {
      label: text.matched,
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    CLOSED: {
      label: text.closed,
      className: "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400",
    },
    EXPIRED: {
      label: text.expiredStatus,
      className: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
    },
  };

  const genderLabels: Record<string, string> = {
    MALE: text.male,
    FEMALE: text.female,
    PREFER_NOT_TO_SAY: text.unspecified,
  };

  const localizedSportName = localizeSportName(listing.sport.name, locale);

  const locationLabel = listing.district
    ? `${listing.district.city?.country?.name ? `${listing.district.city.country.name}, ` : ""}${listing.district.city?.name ?? listing.city?.name ?? ""}, ${listing.district.name}`
    : listing.city?.country?.name
    ? `${listing.city.country.name}, ${listing.city.name}`
    : listing.city?.name ?? "";

  const t = useTranslations("listings");

  const dateStr = format(new Date(listing.dateTime), "d MMM yyyy, HH:mm", {
    locale: dateLocale,
  });

  const timeLeft = listing.expiresAt
    ? formatDistanceToNow(new Date(listing.expiresAt), { locale: dateLocale, addSuffix: false })
    : null;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profil/${listing.user.id}`);
  };

  const typeConfig = {
    ...LISTING_TYPE_CONFIG[listing.type],
    label: t(`types.${listing.type}`)
  };

  const isUrgent = !!(listing as any).isUrgent;

  return (
    <article
      onClick={() => router.push(`/ilan/${listing.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/ilan/${listing.id}`)}
      className={`rounded-xl border hover:shadow-md transition-all duration-200 cursor-pointer h-full relative group overflow-hidden ${
        listing.status === "MATCHED"
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-300 dark:border-emerald-600 border-l-[4px] border-l-emerald-500 shadow-emerald-100 dark:shadow-emerald-900/20 shadow-md"
          : isUrgent
          ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 border-l-[3px] border-l-red-500 ring-1 ring-red-200 dark:ring-red-800"
          : listing.type === "RIVAL"
          ? "bg-white dark:bg-gray-800 border-orange-200/80 dark:border-orange-700/30 border-l-[4px] border-l-orange-500 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-orange-50 dark:hover:shadow-orange-900/10"
          : listing.type === "PARTNER"
          ? "bg-white dark:bg-gray-800 border-emerald-200/80 dark:border-emerald-700/30 border-l-[4px] border-l-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-emerald-50 dark:hover:shadow-emerald-900/10"
          : `bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/60 border-l-[3px] ${typeConfig.accentColor} hover:border-gray-300 dark:hover:border-gray-600`
      }`}
      role="button"
      tabIndex={0}
      aria-label={`${localizedSportName} ${t("title")} ${t("detail")}`}
    >
      {/* MATCHED banner */}
      {listing.status === "MATCHED" && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-bold px-3 py-1 flex items-center gap-1.5 z-10">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          {text.matchedCompleted}
        </div>
      )}
      <div className={`p-4 ${listing.status === "MATCHED" ? "pt-8" : ""}`}>
      {/* Üst etiketler */}
      <div className="flex flex-wrap gap-1.5 mb-2 items-center">
        <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
          listing.type === "RIVAL" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" :
          listing.type === "PARTNER" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
          listing.type === "TRAINER" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" :
          "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
        }`}>
          {typeConfig.label}
        </span>
        {(listing as any).isUrgent && (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold animate-pulse">
            ⚡ {t("urgent") || text.urgent}
          </span>
        )}
        {(listing as any).isAnonymous && (
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            🕵️ {t("anonymous") || text.anonymous}
          </span>
        )}
        {listing.isQuick && timeLeft && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            ⚡ {timeLeft} {t("left") || text.left}
          </span>
        )}
        {(listing as any).isUrgent && (listing as any).expiresAt && (
          <UrgentCountdown expiresAt={(listing as any).expiresAt} expiredText={text.expired} leftText={text.left} />
        )}
        {listing.allowedGender === "FEMALE_ONLY" && (
          <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-full font-semibold">
            👩 {t("femaleOnly") || text.femaleOnly}
          </span>
        )}
        {listing.allowedGender === "MALE_ONLY" && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
            👨 {t("maleOnly") || text.maleOnly}
          </span>
        )}
        {typeof listing.compatibilityScore === "number" && listing.compatibilityScore > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              listing.compatibilityScore >= 70
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : listing.compatibilityScore >= 40
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            🎯 %{listing.compatibilityScore} {t("compatible") || text.compatible}
          </span>
        )}
        {listing.status && listing.status !== "OPEN" && listing.status !== "MATCHED" && statusLabels[listing.status] && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusLabels[listing.status].className}`}>
            {statusLabels[listing.status].label}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between mb-3 pr-8">
        <div className="flex items-center gap-2">
          <span
            className="text-2xl"
            role="img"
            aria-label={localizedSportName}
          >
            {listing.sport.icon || "🏅"}
          </span>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              {localizedSportName}
            </h3>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${LEVEL_COLORS[listing.level]}`}
        >
          {t(`levels.${listing.level}`)}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span role="img" aria-label="konum">📍</span>
          <span>{locationLabel}</span>
        </div>
        {listing.venue && (
          <div className="flex items-center gap-1">
            <span role="img" aria-label="mekan">🏟️</span>
            <span>{listing.venue.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span role="img" aria-label="tarih">📅</span>
          <time dateTime={listing.dateTime}>{dateStr}</time>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div 
              onClick={handleUserClick}
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0 cursor-pointer"
            >
              {listing.user.avatarUrl ? (
                <img 
                  src={listing.user.avatarUrl} 
                  alt={listing.user.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-[10px] font-bold text-gray-500">{listing.user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={handleUserClick}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition font-medium truncate max-w-[120px]"
            >
              {listing.user.name}
            </button>
            <div className="flex items-center gap-1.5 text-xs">
              {listing.user.gender && (
                <span title={genderLabels[listing.user.gender]} className="opacity-70">
                  {GENDER_ICONS[listing.user.gender]}
                </span>
              )}
              {(() => {
                const age = listing.user.birthDate ? differenceInYears(new Date(), new Date(listing.user.birthDate)) : null;
                return age ? <span className="text-gray-400 dark:text-gray-500 font-bold">{age}</span> : null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {listing.description && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {listing.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {listing.maxParticipants > 2 ? (
              <>👥 {listing._count.responses + 1}/{listing.maxParticipants}</>
            ) : (
              <>💬 {listing._count.responses} {listing.type === "TRAINER" ? text.responseTrainer : text.responseDefault}</>
            )}
          </span>
          {listing.maxParticipants > 2 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-medium shrink-0">
              {text.group}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {listing.type === "EQUIPMENT" && listing.equipmentDetail && (
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              💰 {listing.equipmentDetail.price.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} ₺
            </span>
          )}
          {listing.type === "TRAINER" && listing.trainerProfile?.hourlyRate && (
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
              {listing.trainerProfile.hourlyRate.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} ₺<span className="text-xs font-normal opacity-70">{text.perHour}</span>
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${typeConfig.badgeCls} bg-gray-50 dark:bg-gray-700/60 group-hover:brightness-110 transition`}>
            {t("detail") || text.detail} <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </span>
        </div>
      </div>
      </div>
    </article>
  );
}
