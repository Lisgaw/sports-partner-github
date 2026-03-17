"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import toast from "@/lib/toast";
import Button from "@/components/ui/Button";

type Step = "email" | "sent";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("sent");
      } else {
        toast.error(data.error || t("genericError"));
      }
    } catch {
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition";

  if (step === "sent") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t("forgot.sentTitle")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t("forgot.sentBody", { email })}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            {t("forgot.notReceived")}{" "}
            <button
              onClick={() => setStep("email")}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              {t("forgot.tryAgain")}
            </button>
          </p>
          <Link href="/auth/giris">
            <Button variant="secondary" className="w-full">{t("forgot.backToLogin")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("forgot.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t("forgot.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            {t("forgot.submit")}
          </Button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-sm">
          {t("forgot.remembered")}{" "}
          <Link href="/auth/giris" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
