"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import toast from "@/lib/toast";
import { resolveAppLocale } from "@/lib/localized-ui";

type FollowRequest = {
  followId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
    city: { name: string } | null;
    sports: { id: string; name: string; icon: string | null }[];
  };
};

const PAGE_COPY = {
  tr: {
    title: "Takip İstekleri",
    subtitle: "Seni takip etmek isteyen kişiler",
    noRequests: "Bekleyen takip isteği yok",
    noRequestsHint: "Birisi seni takip etmek istediğinde burada görünür.",
    accept: "Kabul Et",
    reject: "Reddet",
    accepted: "Takip isteği kabul edildi",
    rejected: "Takip isteği reddedildi",
    failed: "İşlem başarısız",
    error: "Bir hata oluştu",
    loadFailed: "İstekler yüklenemedi",
    back: "← Geri",
    sports: "Sporlar",
  },
  en: {
    title: "Follow Requests",
    subtitle: "People who want to follow you",
    noRequests: "No pending follow requests",
    noRequestsHint: "When someone wants to follow you, it will appear here.",
    accept: "Accept",
    reject: "Reject",
    accepted: "Follow request accepted",
    rejected: "Follow request rejected",
    failed: "Action failed",
    error: "Something went wrong",
    loadFailed: "Could not load requests",
    back: "← Back",
    sports: "Sports",
  },
  ru: {
    title: "Запросы на подписку",
    subtitle: "Люди, которые хотят подписаться на вас",
    noRequests: "Нет ожидающих запросов",
    noRequestsHint: "Когда кто-то захочет подписаться на вас, это появится здесь.",
    accept: "Принять",
    reject: "Отклонить",
    accepted: "Запрос на подписку принят",
    rejected: "Запрос на подписку отклонён",
    failed: "Не удалось выполнить",
    error: "Произошла ошибка",
    loadFailed: "Не удалось загрузить запросы",
    back: "← Назад",
    sports: "Спорт",
  },
} as const;

type CopyKeys = keyof typeof PAGE_COPY;

export default function FollowRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const safeLocale = resolveAppLocale(locale);
  const copy = PAGE_COPY[safeLocale as CopyKeys] ?? PAGE_COPY.en;

  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/giris");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/follow-requests")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRequests(json.data);
        else toast.error(copy.loadFailed);
      })
      .catch(() => toast.error(copy.error))
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleAction = async (followId: string, action: "ACCEPT" | "REJECT") => {
    setProcessingId(followId);
    try {
      const res = await fetch("/api/follow-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followId, action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === "ACCEPT" ? copy.accepted : copy.rejected);
        setRequests((prev) => prev.filter((r) => r.followId !== followId));
      } else {
        toast.error(json.error ?? copy.failed);
      }
    } catch {
      toast.error(copy.error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4 space-y-4">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition mb-3"
        >
          {copy.back}
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{copy.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{copy.subtitle}</p>
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <span className="text-5xl block mb-3">🔔</span>
          <p className="text-base font-semibold text-gray-600 dark:text-gray-300">{copy.noRequests}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{copy.noRequestsHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.followId}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Link href={`/profil/${req.user.id}`} className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-lg font-bold text-emerald-700 dark:text-emerald-300 overflow-hidden border-2 border-emerald-200 dark:border-emerald-700">
                    {req.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={req.user.avatarUrl} alt={req.user.name} className="w-full h-full object-cover" />
                    ) : (
                      req.user.name?.[0]?.toUpperCase()
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/profil/${req.user.id}`} className="hover:opacity-80 transition">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{req.user.name}</p>
                  </Link>
                  {req.user.city && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">📍 {req.user.city.name}</p>
                  )}
                  {req.user.bio && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{req.user.bio}</p>
                  )}
                  {req.user.sports.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {req.user.sports.slice(0, 4).map((sport) => (
                        <span
                          key={sport.id}
                          className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                        >
                          {sport.icon} {sport.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAction(req.followId, "ACCEPT")}
                  disabled={processingId === req.followId}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition"
                >
                  {processingId === req.followId ? "…" : copy.accept}
                </button>
                <button
                  onClick={() => handleAction(req.followId, "REJECT")}
                  disabled={processingId === req.followId}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-300 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400 text-sm font-semibold py-2 rounded-xl transition disabled:opacity-50"
                >
                  {processingId === req.followId ? "…" : copy.reject}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
