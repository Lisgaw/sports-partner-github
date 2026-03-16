"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AyarlarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const t = useTranslations("settings");

  const menu = useMemo(() => ([
    {
      href: "/profil",
      icon: "👤",
      label: t("profile"),
      desc: t("editProfileDesc"),
    },
    {
      href: "/ayarlar/guvenlik",
      icon: "🔒",
      label: t("security"),
      desc: t("securityDesc"),
    },
    {
      href: "/ayarlar/profesyonel",
      icon: "⭐",
      label: t("professional"),
      desc: t("professionalDesc"),
    },
    {
      href: "/ayarlar/gizlilik",
      icon: "🛡️",
      label: t("privacy"),
      desc: t("privacyDesc"),
    },
    {
      href: "/ayarlar/bildirimler",
      icon: "🔔",
      label: t("notifications"),
      desc: t("notificationsDesc"),
    },
    {
      href: "/ayarlar/davet",
      icon: "🎁",
      label: t("invite"),
      desc: t("inviteDesc"),
    },
  ]), [t]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/giris");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">{t("title")}</h1>
      <div className="md:hidden mb-5 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("quickTitle")}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("quickDesc")}</p>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {menu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-w-max rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-full md:w-64 shrink-0">
          <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            {menu.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
                    active
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-l-emerald-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${active ? "text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 hidden md:block">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/profil"
            className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-1"
          >
            {t("backToProfile")}
          </Link>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
