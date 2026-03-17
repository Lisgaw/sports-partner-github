"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import toast from "@/lib/toast";
import { registerUser } from "@/services/api";
import Button from "@/components/ui/Button";
import { useLocations } from "@/hooks/useLocations";
import LocationSelector from "@/components/LocationSelector";

// ─── Adım göstergesi ────────────────────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              active
                ? "w-8 bg-emerald-500"
                : done
                ? "w-8 bg-emerald-300"
                : "w-8 bg-gray-200 dark:bg-gray-600"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function KayitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const refCode = searchParams.get("ref") || "";
  const { status } = useSession();
  const { locations, loading: locLoading } = useLocations();

  const [step, setStep] = useState(1); // 1: Temel Bilgiler, 2: Konum/Profil
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state — sadece bireysel bilgiler
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    gender: "" as "" | "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY",
    birthDate: "",
    countryId: "",
    cityId: "",
    districtId: "",
  });

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  // ─── Konum yardımcıları ──────────────────────────────────────────────
  const countries = locations;
  const cities = countries.find((c) => c.id === form.countryId)?.cities || [];
  const selectedCity = cities.find((c) => c.id === form.cityId);
  const districts = selectedCity?.districts || [];

  // ─── Validasyon ──────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    if (form.name.trim().length < 2) { toast.error(t("register.validation.nameMin")); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error(t("register.validation.emailInvalid")); return false; }
    if (form.password.length < 8) { toast.error(t("register.validation.passwordMin")); return false; }
    if (!/[A-Z]/.test(form.password)) { toast.error(t("register.validation.passwordUpper")); return false; }
    if (!/[a-z]/.test(form.password)) { toast.error(t("register.validation.passwordLower")); return false; }
    if (!/[0-9]/.test(form.password)) { toast.error(t("register.validation.passwordNumber")); return false; }
    if (!/[^A-Za-z0-9]/.test(form.password)) { toast.error(t("register.validation.passwordSpecial")); return false; }
    if (form.password !== form.passwordConfirm) { toast.error(t("register.validation.passwordMismatch")); return false; }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!form.gender) { toast.error(t("register.validation.genderRequired")); return false; }
    if (!form.birthDate) { toast.error(t("register.validation.birthDateRequired")); return false; }
    if (!form.countryId) { toast.error(t("register.validation.countryRequired")); return false; }
    if (!form.cityId) { toast.error(t("register.validation.cityRequired")); return false; }
    if (!form.districtId) { toast.error(t("register.validation.districtRequired")); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
        countryId: form.countryId,
        cityId: form.cityId,
        districtId: form.districtId,
        referralCode: refCode || undefined,
      });

      if (!res.success) {
        toast.error(res.error || t("register.submitFailed"));
        return;
      }

      toast.success(t("register.submitSuccess"));

      // Otomatik giriş yap
      const signInRes = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.error(t("register.autoLoginFailed"));
        router.push("/auth/giris");
      } else {
        // Onboarding'e yönlendir
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err: unknown) {
      // API'den gelen spesifik hata mesajını göster (ör: email zaten kayıtlı)
      const message = err instanceof Error ? err.message : t("register.retryError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Başlık */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {t("register.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === 1 ? t("register.step1Subtitle") : t("register.step2Subtitle")}
          </p>
        </div>

        <StepBar current={step} total={2} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ─── ADIM 1: Temel Bilgiler ──────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <label htmlFor="name" className={labelClass}>
                  {t("register.fullName")}
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder={t("register.fullNamePlaceholder")}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  {t("password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={inputClass}
                    placeholder={t("register.passwordMinPlaceholder")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPassword ? t("register.hide") : t("register.show")}
                  </button>
                </div>
                {/* Şifre gücü göstergesi */}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    {[
                      { test: form.password.length >= 8, label: t("register.rules.min") },
                      { test: /[A-Z]/.test(form.password), label: t("register.rules.upper") },
                      { test: /[a-z]/.test(form.password), label: t("register.rules.lower") },
                      { test: /[0-9]/.test(form.password), label: t("register.rules.number") },
                      { test: /[^A-Za-z0-9]/.test(form.password), label: t("register.rules.special") },
                    ].map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        <span className={`text-xs ${rule.test ? "text-emerald-500" : "text-gray-400"}`}>
                          {rule.test ? "✓" : "○"}
                        </span>
                        <span className={`text-xs ${rule.test ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="passwordConfirm" className={labelClass}>
                  {t("register.passwordConfirm")}
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  required
                  value={form.passwordConfirm}
                  onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                  className={inputClass}
                  placeholder={t("register.passwordConfirmPlaceholder")}
                  autoComplete="new-password"
                />
                {form.passwordConfirm && form.password !== form.passwordConfirm && (
                  <p className="text-xs text-red-500 mt-1">{t("register.validation.passwordMismatch")}</p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleNext}
                className="w-full"
              >
                {t("register.continue")}
              </Button>
            </>
          )}

          {/* ─── ADIM 2: Konum & Profil ──────────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <label htmlFor="gender" className={labelClass}>
                  {t("register.gender")}
                </label>
                <select
                  id="gender"
                  required
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as typeof form.gender })}
                  className={inputClass}
                >
                  <option value="">{t("register.genderPlaceholder")}</option>
                  <option value="MALE">{t("register.genderMale")}</option>
                  <option value="FEMALE">{t("register.genderFemale")}</option>
                  <option value="PREFER_NOT_TO_SAY">{t("register.genderPreferNotToSay")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="birthDate" className={labelClass}>
                  {t("register.birthDate")}
                </label>
                <input
                  id="birthDate"
                  type="date"
                  required
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className={inputClass}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  {t("register.phone")} <span className="text-gray-400 font-normal">{t("register.optional")}</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder={t("register.phonePlaceholder")}
                  autoComplete="tel"
                />
              </div>

              <div className="col-span-full">
                <LocationSelector
                  countryId={form.countryId}
                  cityId={form.cityId}
                  districtId={form.districtId}
                  onChange={(updates) => setForm({ ...form, ...updates })}
                  className="grid grid-cols-1 gap-4"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t("register.back")}
                </button>
                <Button type="submit" loading={loading} className="flex-1">
                  {t("signUp")}
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
          {t("hasAccount")}{" "}
          <Link
            href="/auth/giris"
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
