"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import toast from "@/lib/toast";
import { updateProfile } from "@/services/api";
import Button from "@/components/ui/Button";

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export default function GuvenlikPage() {
  const router = useRouter();
  const t = useTranslations("settings.securityPage");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) { toast.error(t("enterCurrentPassword")); return; }
    if (passwordForm.newPassword.length < 8) { toast.error(t("minLength")); return; }
    if (!/[A-Z]/.test(passwordForm.newPassword)) { toast.error(t("requireUpper")); return; }
    if (!/[0-9]/.test(passwordForm.newPassword)) { toast.error(t("requireNumber")); return; }
    if (!/[^A-Za-z0-9]/.test(passwordForm.newPassword)) { toast.error(t("requireSpecial")); return; }
    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) { toast.error(t("mismatch")); return; }

    setSavingPassword(true);
    try {
      const res = await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.success) {
        toast.success(t("changed"));
        setPasswordForm({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
      } else {
        toast.error((res as any).error || t("changeFailed"));
      }
    } catch {
      toast.error(t("genericError"));
    } finally {
      setSavingPassword(false);
    }
  };

  const rules = [
    { test: passwordForm.newPassword.length >= 8, label: t("ruleMin") },
    { test: /[A-Z]/.test(passwordForm.newPassword), label: t("ruleUpper") },
    { test: /[a-z]/.test(passwordForm.newPassword), label: t("ruleLower") },
    { test: /[0-9]/.test(passwordForm.newPassword), label: t("ruleNumber") },
    { test: /[^A-Za-z0-9]/.test(passwordForm.newPassword), label: t("ruleSpecial") },
  ];

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{t("title")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t("subtitle")}
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className={labelClass}>{t("currentPassword")}</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={inputClass}
                placeholder={t("currentPasswordPh")}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm hover:text-gray-600"
              >
                {showCurrent ? t("hide") : t("show")}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("newPassword")}</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={inputClass}
                placeholder={t("newPasswordPh")}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm hover:text-gray-600"
              >
                {showNew ? t("hide") : t("show")}
              </button>
            </div>
            {passwordForm.newPassword && (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {rules.map((r) => (
                  <div key={r.label} className="flex items-center gap-1.5">
                    <span className={`text-xs ${r.test ? "text-emerald-500" : "text-gray-400"}`}>{r.test ? "âœ“" : "â—‹"}</span>
                    <span className={`text-xs ${r.test ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>{t("newPasswordRepeat")}</label>
            <input
              type="password"
              value={passwordForm.newPasswordConfirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPasswordConfirm: e.target.value })}
              className={inputClass}
              placeholder={t("newPasswordRepeatPh")}
              autoComplete="new-password"
            />
            {passwordForm.newPasswordConfirm && passwordForm.newPassword !== passwordForm.newPasswordConfirm && (
              <p className="text-xs text-red-500 mt-1">{t("mismatch")}</p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={savingPassword} className="min-w-[160px]">
              {t("submit")}
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-red-700 dark:text-red-400 mb-1">{t("dangerTitle")}</h3>
        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
          {t("dangerDesc")}
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            {t("deleteAccount")}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {t("confirmPasswordPrompt")}
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={inputClass}
              placeholder={t("currentPasswordPh")}
              autoComplete="current-password"
            />
            <div className="flex gap-3">
              <button
                disabled={deleting || !deletePassword}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch("/api/profile", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ password: deletePassword }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(t("deletedSuccess"));
                      await signOut({ redirect: false });
                      router.push("/auth/giris");
                    } else {
                      toast.error(data.error || t("deleteFailed"));
                    }
                  } catch {
                    toast.error(t("genericError"));
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("deleteConfirm")}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
