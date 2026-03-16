import { useLocale, useTranslations } from "next-intl";
import { localizeSportName } from "@/lib/localized-ui";

interface Sport {
  id: string;
  icon: string;
  name: string;
}

interface ProfileSportsStripProps {
  sports: Sport[];
  preferredTime?: string | null;
  preferredStyle?: string | null;
}

export default function ProfileSportsStrip({
  sports,
  preferredTime,
  preferredStyle,
}: ProfileSportsStripProps) {
  const t = useTranslations("profile.sports");
  const locale = useLocale();
  const TIME_LABELS: Record<string, string> = {
    morning: t("morning"),
    evening: t("evening"),
    anytime: t("anytime"),
  };
  const STYLE_LABELS: Record<string, string> = {
    competitive: t("competitive"),
    casual: t("casual"),
    both: t("both"),
  };
  const hasContent = preferredTime || preferredStyle || sports.length > 0;
  if (!hasContent) return null;

  return (
    <div className="px-4 sm:px-5 py-3 mb-3 border-t border-gray-100 dark:border-gray-800">
      <div className="flex flex-wrap gap-1.5 items-center">
        {sports.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full"
          >
            {s.icon} {localizeSportName(s.name, locale)}
          </span>
        ))}

        {preferredTime && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1">
            {TIME_LABELS[preferredTime] ?? preferredTime}
          </span>
        )}

        {preferredStyle && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1">
            {STYLE_LABELS[preferredStyle] ?? preferredStyle}
          </span>
        )}
      </div>
    </div>
  );
}
