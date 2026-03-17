"use client";

import { useState, useRef, useEffect } from "react";
import { differenceInYears } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { localizeLessonType, resolveAppLocale } from "@/lib/localized-ui";

interface TrainerProfile {
  isVerified: boolean;
  gymName?: string | null;
  university?: string | null;
  department?: string | null;
  experienceYears?: number | null;
  lessonTypes?: string[];
  providesEquipment?: boolean | null;
  certNote?: string | null;
  trainerBadgeVisible?: boolean;
  specializations?: { sportName: string; years: number }[];
}

interface User {
  name: string;
  avatarUrl?: string | null;
  birthDate?: string | null;
  city?: { name: string } | null;
}

interface Props {
  trainerProfile: TrainerProfile;
  user: User;
  /** true when viewing your own profile — shows visibility hint */
  isOwn?: boolean;
}

const LESSON_TYPE_ICONS: Record<string, string> = {
  birebir: "👤",
  grup: "👥",
  cocuk: "🧒",
  performans: "🏆",
};

const TRAINER_BADGE_COPY = {
  tr: {
    verifiedTrainer: "Onaylı Antrenör",
    viewTrainerInfo: "Antrenör bilgilerini görüntüle",
    age: "Yaş",
    city: "Şehir",
    specializations: "Uzmanlık Alanları",
    educationCertificates: "Eğitim & Sertifikalar",
    hourlyRate: "Saatlik ücret",
    perHour: "/sa",
    equipmentProvided: "Ekipman sağlanıyor",
    equipmentNotProvided: "Ekipman sağlanmıyor",
    visibilityHint: "Görünürlüğü Gizlilik Ayarları'ndan değiştirebilirsin",
  },
  en: {
    verifiedTrainer: "Verified Trainer",
    viewTrainerInfo: "View trainer details",
    age: "Age",
    city: "City",
    specializations: "Specializations",
    educationCertificates: "Education & Certificates",
    hourlyRate: "Hourly rate",
    perHour: "/h",
    equipmentProvided: "Equipment provided",
    equipmentNotProvided: "No equipment provided",
    visibilityHint: "You can change this visibility in Privacy Settings",
  },
  ru: {
    verifiedTrainer: "Проверенный тренер",
    viewTrainerInfo: "Показать данные тренера",
    age: "Возраст",
    city: "Город",
    specializations: "Специализации",
    educationCertificates: "Образование и сертификаты",
    hourlyRate: "Почасовая ставка",
    perHour: "/ч",
    equipmentProvided: "Инвентарь предоставляется",
    equipmentNotProvided: "Инвентарь не предоставляется",
    visibilityHint: "Видимость можно изменить в настройках приватности",
  },
  de: {
    verifiedTrainer: "Verifizierter Trainer",
    viewTrainerInfo: "Trainerdetails anzeigen",
    age: "Alter",
    city: "Stadt",
    specializations: "Spezialisierungen",
    educationCertificates: "Ausbildung und Zertifikate",
    hourlyRate: "Stundensatz",
    perHour: "/Std.",
    equipmentProvided: "Ausrüstung vorhanden",
    equipmentNotProvided: "Keine Ausrüstung vorhanden",
    visibilityHint: "Die Sichtbarkeit kannst du in den Privatsphäre-Einstellungen ändern",
  },
  fr: {
    verifiedTrainer: "Coach vérifié",
    viewTrainerInfo: "Voir les informations du coach",
    age: "Âge",
    city: "Ville",
    specializations: "Spécialisations",
    educationCertificates: "Formation et certificats",
    hourlyRate: "Tarif horaire",
    perHour: "/h",
    equipmentProvided: "Équipement fourni",
    equipmentNotProvided: "Pas d'équipement fourni",
    visibilityHint: "Vous pouvez changer cette visibilité dans les paramètres de confidentialité",
  },
  es: {
    verifiedTrainer: "Entrenador verificado",
    viewTrainerInfo: "Ver datos del entrenador",
    age: "Edad",
    city: "Ciudad",
    specializations: "Especialidades",
    educationCertificates: "Educación y certificados",
    hourlyRate: "Tarifa por hora",
    perHour: "/h",
    equipmentProvided: "Equipo incluido",
    equipmentNotProvided: "Sin equipo incluido",
    visibilityHint: "Puedes cambiar esta visibilidad en la configuración de privacidad",
  },
  ja: {
    verifiedTrainer: "認証トレーナー",
    viewTrainerInfo: "トレーナー情報を見る",
    age: "年齢",
    city: "都市",
    specializations: "専門分野",
    educationCertificates: "学歴・資格",
    hourlyRate: "時間料金",
    perHour: "/時",
    equipmentProvided: "用具あり",
    equipmentNotProvided: "用具なし",
    visibilityHint: "表示設定はプライバシー設定から変更できます",
  },
  ko: {
    verifiedTrainer: "인증 트레이너",
    viewTrainerInfo: "트레이너 정보 보기",
    age: "나이",
    city: "도시",
    specializations: "전문 분야",
    educationCertificates: "교육 및 자격증",
    hourlyRate: "시간당 요금",
    perHour: "/시간",
    equipmentProvided: "장비 제공",
    equipmentNotProvided: "장비 미제공",
    visibilityHint: "공개 여부는 개인정보 설정에서 변경할 수 있습니다",
  },
} as const;

export default function TrainerBadgePopup({ trainerProfile, user, isOwn }: Props) {
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const tProf = useTranslations("settings.professionalPage");
  const copy = TRAINER_BADGE_COPY[resolveAppLocale(locale)];

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Don't show popup to others if badge is hidden
  if (!isOwn && !trainerProfile.trainerBadgeVisible) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {copy.verifiedTrainer}
      </span>
    );
  }

  const age = user.birthDate ? differenceInYears(new Date(), new Date(user.birthDate)) : null;
  const lessonTypes = trainerProfile.lessonTypes ?? [];
  const specializations = trainerProfile.specializations ?? [];

  return (
    <div className="relative inline-block" ref={popupRef}>
      {/* Badge butonu */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm hover:from-blue-600 hover:to-indigo-700 transition cursor-pointer"
        title={copy.viewTrainerInfo}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {copy.verifiedTrainer}
        <svg className="w-3 h-3 ml-0.5 opacity-80" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
        </svg>
      </button>

      {/* Popup kartı */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/50" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white text-sm">{user.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span className="text-xs text-white/90 font-semibold">{copy.verifiedTrainer}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bilgiler */}
            <div className="px-4 py-3 space-y-3">

              {/* Temel bilgiler */}
              <div className="grid grid-cols-2 gap-2">
                {age !== null && (
                  <InfoChip icon="🎂" label={copy.age} value={`${age}`} />
                )}
                {user.city?.name && (
                  <InfoChip icon="📍" label={copy.city} value={user.city.name} />
                )}
                {trainerProfile.experienceYears != null && (
                  <InfoChip icon="📅" label={tProf("experience")} value={String(trainerProfile.experienceYears)} />
                )}
                {trainerProfile.gymName && (
                  <InfoChip icon="🏢" label={tProf("gymName")} value={trainerProfile.gymName} />
                )}
              </div>

              {/* Üniversite & Bölüm */}
              {(trainerProfile.university || trainerProfile.department) && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 space-y-1">
                  {trainerProfile.university && (
                    <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                      <span className="mt-0.5">🎓</span>
                      <span><strong>{tProf("university")}:</strong> {trainerProfile.university}</span>
                    </div>
                  )}
                  {trainerProfile.department && (
                    <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                      <span className="mt-0.5">📚</span>
                      <span><strong>{tProf("department")}:</strong> {trainerProfile.department}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Branşlar / Uzmanlıklar */}
              {specializations.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{copy.specializations}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {specializations.map((sp, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        🏅 {sp.sportName}{sp.years ? ` · ${sp.years}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ders türleri */}
              {lessonTypes.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{tProf("lessonTypes")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lessonTypes.map((lt) => {
                      const icon = LESSON_TYPE_ICONS[lt] ?? "📋";
                      return (
                        <span key={lt} className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                          {icon} {localizeLessonType(lt, locale)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ekipman */}
              {trainerProfile.providesEquipment != null && (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
                  trainerProfile.providesEquipment
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                }`}>
                  <span className="text-base">{trainerProfile.providesEquipment ? "✅" : "❌"}</span>
                  <span className="font-medium">
                    {trainerProfile.providesEquipment ? copy.equipmentProvided : copy.equipmentNotProvided}
                  </span>
                </div>
              )}

              {/* Eğitim & Sertifika */}
              {trainerProfile.certNote && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{copy.educationCertificates}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/40 rounded-xl p-2.5">
                    {trainerProfile.certNote}
                  </p>
                </div>
              )}

              {/* Saatlik ücret */}
              {(trainerProfile as any).hourlyRate && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{copy.hourlyRate}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{(trainerProfile as any).hourlyRate}₺{copy.perHour}</span>
                </div>
              )}

              {/* Kendi profili ise görünürlük ipucu */}
              {isOwn && (
                <div className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {copy.visibilityHint}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl px-2.5 py-2">
      <span className="text-sm mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-none">{label}</p>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
