"use client";

import { useTranslations } from "next-intl";

interface ProfileCompletionProps {
  user: {
    name?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    phone?: string | null;
    bio?: string | null;
    birthDate?: string | null;
    gender?: string | null;
    cityId?: string | null;
    districtId?: string | null;
    sports?: { id: string }[];
    userType?: string;
    trainerBranches?: unknown[];
    venueName?: string | null;
    venueAddress?: string | null;
  };
  listings?: { id: string }[];
  matches?: { id: string }[];
}

interface FieldCheck {
  key: string;
  tipKey: string;
  weight: number;
  done: boolean;
}

export function getProfileCompletion(props: ProfileCompletionProps) {
  const { user, listings = [], matches = [] } = props;

  const fields: FieldCheck[] = [
    { key: "avatar",    tipKey: "avatarTip",    weight: 15, done: !!user.avatarUrl },
    { key: "bio",       tipKey: "bioTip",       weight: 10, done: !!user.bio },
    { key: "sport",     tipKey: "sportTip",     weight: 15, done: (user.sports?.length ?? 0) > 0 },
    { key: "city",      tipKey: "cityTip",      weight: 10, done: !!user.cityId },
    { key: "phone",     tipKey: "phoneTip",     weight: 10, done: !!user.phone },
    { key: "birthDate", tipKey: "birthDateTip", weight: 5,  done: !!user.birthDate },
    { key: "gender",    tipKey: "genderTip",    weight: 5,  done: !!user.gender },
    { key: "listing",   tipKey: "listingTip",   weight: 15, done: listings.length > 0 },
    { key: "match",     tipKey: "matchTip",     weight: 15, done: matches.length > 0 },
  ];

  const score = fields.reduce((acc, f) => acc + (f.done ? f.weight : 0), 0);
  const incomplete = fields.filter((f) => !f.done);

  return { score, fields, incomplete };
}

export default function ProfileCompletionRing({ user, listings, matches }: ProfileCompletionProps) {
  const t = useTranslations("profile.completion");
  const { score, incomplete } = getProfileCompletion({ user, listings, matches });

  if (score >= 100) return null;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "text-emerald-500" :
    score >= 50 ? "text-amber-500" :
    "text-red-400";

  const strokeColor =
    score >= 80 ? "#10b981" :
    score >= 50 ? "#f59e0b" :
    "#f87171";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* SVG Ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="40" cy="40" r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${color}`}>%{score}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            {t("title")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {score >= 80 ? t("nearlyDone") : score >= 50 ? t("doingWell") : t("completeProfile")}
          </p>
          {incomplete.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {incomplete.slice(0, 3).map((f) => (
                <span
                  key={f.key}
                  className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                >
                  {t(f.tipKey as Parameters<typeof t>[0])}
                </span>
              ))}
              {incomplete.length > 3 && (
                <span className="text-[10px] text-gray-400">+{incomplete.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
