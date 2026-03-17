import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const OPEN_GRAPH_LOCALE_MAP: Record<string, string> = {
  tr: "tr_TR",
  en: "en_US",
  ru: "ru_RU",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  ja: "ja_JP",
  ko: "ko_KR",
};

const METADATA_KEYWORDS_FALLBACK = ["sports", "partner", "rival", "football", "basketball", "tennis"];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "layout" });
  const keywords = t("metadata.keywords")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    keywords: keywords.length > 0 ? keywords : METADATA_KEYWORDS_FALLBACK,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("brandName"),
    },
    openGraph: {
      title: t("metadata.title"),
      description: t("metadata.description"),
      type: "website",
      locale: OPEN_GRAPH_LOCALE_MAP[locale] ?? "en_US",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const tLayout = await getTranslations({ locale, namespace: "layout" });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#059669" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})()`
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("/service-worker.js"); }); }`
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col text-gray-900 dark:text-gray-100 transition-colors`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold">
              {tLayout("skipToContent")}
            </a>
            <Navbar />
            <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">{children}</main>
            <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-[calc(72px+env(safe-area-inset-bottom))] md:mb-0">
              <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center text-white text-[9px] font-black">SP</span>
                  <span className="font-medium">{tLayout("copyright", { year: new Date().getFullYear() })}</span>
                </div>
                <nav className="flex items-center gap-4">
                  <a href="/gizlilik-politikasi" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">{tLayout("privacyPolicy")}</a>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <a href="/kullanim-sartlari" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">{tLayout("termsOfUse")}</a>
                </nav>
              </div>
            </footer>
            <BottomNav />
            <PWAInstallBanner />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
