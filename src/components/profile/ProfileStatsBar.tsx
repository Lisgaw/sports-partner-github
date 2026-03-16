import { useTranslations } from "next-intl";

interface ProfileStatsBarProps {
  matchCount: number;
  avgRating?: number | null;
  followerCount: number;
  totalPoints: number;
}

const XP_TIER_KEYS = [
  { icon: "🔒", key: "beginnerTier", min: 0,   max: 50 },
  { icon: "🥉", key: "bronzeTier",   min: 50,  max: 100 },
  { icon: "🥈", key: "silverTier",   min: 100, max: 200 },
  { icon: "🥇", key: "goldTier",     min: 200, max: 400 },
  { icon: "💎", key: "diamondTier",  min: 400, max: null },
] as const;

export default function ProfileStatsBar({
  matchCount,
  avgRating,
  followerCount,
  totalPoints,
}: ProfileStatsBarProps) {
  const t = useTranslations("profile.stats");
  const tier =
    [...XP_TIER_KEYS].reverse().find((t) => totalPoints >= t.min) ?? XP_TIER_KEYS[0];
  const pct =
    tier.max !== null
      ? Math.min(100, Math.round(((totalPoints - tier.min) / (tier.max - tier.min)) * 100))
      : 100;

  return (
    <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-800">
      {/* XP progress */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{tier.icon}</span>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t(tier.key)}</span>
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{totalPoints} XP</span>
        {tier.max !== null && (
          <span className="text-[10px] text-gray-400">({t("xpRemaining", { count: tier.max - totalPoints })})</span>
        )}
      </div>
    </div>
  );
}
