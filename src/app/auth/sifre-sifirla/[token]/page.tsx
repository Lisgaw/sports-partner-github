"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import toast from "@/lib/toast";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const inputClass =
    "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("register.validation.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        toast.success(t("reset.successToast"));
        setTimeout(() => router.push("/auth/giris"), 2000);
      } else {
        toast.error(data.error || t("genericError"));
      }
    } catch {
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t("reset.successTitle")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t("reset.redirecting")}
          </p>
          <Link
            href="/auth/giris"
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
          {t("reset.title")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("reset.newPassword")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={t("reset.newPasswordPlaceholder")}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("register.passwordConfirm")}
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            {t("reset.submit")}
          </Button>
        </form>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-sm">
          <Link
            href="/auth/giris"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {t("reset.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
