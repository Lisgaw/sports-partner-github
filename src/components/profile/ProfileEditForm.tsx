"use client";

import { useEffect, useState } from "react";
import toast from "@/lib/toast";
import { useTranslations, useLocale } from "next-intl";
import Button from "@/components/ui/Button";
import { localizeSportName } from "@/lib/localized-ui";
import type { ProfileEditForm } from "@/types";

interface Sport {
  id: string;
  icon: string | null;
  name: string;
}

interface District {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  districts?: District[];
}

interface Country {
  id: string;
  code: string;
  name: string;
  cities?: City[];
}

interface ProfileEditFormProps {
  editForm: ProfileEditForm;
  setEditForm: (form: ProfileEditForm) => void;
  sports: Sport[];
  locations: Country[];
  isTrainer: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditFormPanel({
  editForm,
  setEditForm,
  sports,
  locations,
  isTrainer,
  saving,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const t = useTranslations("profile.editForm");
  const tProf = useTranslations("settings.professionalPage");
  const locale = useLocale();
  const socialUi = locale === "tr"
    ? {
        add: "Sosyal medya ekle",
        remove: "Kaldir",
        empty: "Henuz sosyal medya hesabi eklenmedi.",
        pickerTitle: "Platform sec",
        linkLabel: "Baglanti veya kullanici adi",
        visibilityLabel: "Kimler gorebilir?",
      }
    : locale === "ru"
    ? {
        add: "Добавить соцсеть",
        remove: "Удалить",
        empty: "Соцсети еще не добавлены.",
        pickerTitle: "Выберите платформу",
        linkLabel: "Ссылка или имя пользователя",
        visibilityLabel: "Кто может видеть?",
      }
    : {
        add: "Add social account",
        remove: "Remove",
        empty: "No social accounts added yet.",
        pickerTitle: "Choose a platform",
        linkLabel: "Link or username",
        visibilityLabel: "Who can see it?",
      };
  const inputCls =
    "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none";
  const [visibleSocialPlatforms, setVisibleSocialPlatforms] = useState<string[]>([]);
  const [showSocialPicker, setShowSocialPicker] = useState(false);

  const selectedCountry = locations.find((l) =>
    l.cities?.some((c) => c.id === editForm.cityId)
  );
  const citiesForCountry = selectedCountry?.cities ?? [];
  const districtsForCity =
    locations
      .flatMap((l) => l.cities ?? [])
      .find((c) => c.id === editForm.cityId)?.districts ?? [];

  const lessonTypeOptions = [
    { id: "birebir", label: tProf("lessonType_birebir") },
    { id: "grup", label: tProf("lessonType_grup") },
    { id: "cocuk", label: tProf("lessonType_cocuk") },
    { id: "performans", label: tProf("lessonType_performans") },
  ] as { id: string; label: string }[];

  const visibilityOptions = [
    { value: "EVERYONE", label: t("visibilityEveryone") },
    { value: "FOLLOWERS", label: t("visibilityFriends") },
    { value: "NOBODY", label: t("visibilityNobody") },
  ] as const;

  const socialPlatforms = [
    {
      key: "instagram",
      visibilityKey: "instagramVisibility",
      placeholder: `Instagram ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/></svg>,
      iconClass: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white",
    },
    {
      key: "tiktok",
      visibilityKey: "tiktokVisibility",
      placeholder: `TikTok ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.79a8.18 8.18 0 004.78 1.52V6.85a4.85 4.85 0 01-1.01-.16z"/></svg>,
      iconClass: "bg-black text-white",
    },
    {
      key: "facebook",
      visibilityKey: "facebookVisibility",
      placeholder: `Facebook ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      iconClass: "bg-[#1877F2] text-white",
    },
    {
      key: "twitterX",
      visibilityKey: "twitterXVisibility",
      placeholder: `X ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      iconClass: "bg-black text-white",
    },
    {
      key: "vk",
      visibilityKey: "vkVisibility",
      placeholder: `VK ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.5h-1.64c-.63 0-.82-.52-1.93-1.63-.96-.96-1.39-.96-1.39 0 0 1.63-.43 1.63-1.08 1.63-1.67 0-3.52-1.04-4.82-2.84-1.96-2.73-2.5-4.72-2.5-5.12 0-.18.15-.35.35-.35h1.64c.26 0 .35.15.44.38.51 1.57 1.39 2.95 1.74 2.95.14 0 .2-.06.2-.38V9.35c-.04-.62-.35-.67-.35-.89 0-.15.12-.3.3-.3h2.57c.22 0 .3.12.3.35v2.74c0 .22.09.3.16.3.14 0 .27-.08.55-.38.87-.99 1.5-2.51 1.5-2.51.09-.2.25-.38.5-.38h1.64c.49 0 .6.25.49.56-.21.64-2.08 2.66-2.08 2.66-.16.24-.22.35 0 .61.16.2.69.74 1.05 1.17.65.73 1.14 1.35 1.27 1.78.14.42-.08.64-.49.64z"/></svg>,
      iconClass: "bg-[#4C75A3] text-white",
    },
    {
      key: "telegram",
      visibilityKey: "telegramVisibility",
      placeholder: `Telegram ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
      iconClass: "bg-[#26A5E4] text-white",
    },
    {
      key: "whatsapp",
      visibilityKey: "whatsappVisibility",
      placeholder: "WhatsApp (+15551234567)",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>,
      iconClass: "bg-[#25D366] text-white",
    },
  ] as const;

  useEffect(() => {
    const filledPlatforms = socialPlatforms
      .filter(({ key }) => Boolean((editForm as Record<string, unknown>)[key]))
      .map(({ key }) => key);

    setVisibleSocialPlatforms((prev) => Array.from(new Set([...prev, ...filledPlatforms])));
  }, [editForm]);

  const activeSocialPlatforms = socialPlatforms.filter(({ key }) => visibleSocialPlatforms.includes(key));
  const availableSocialPlatforms = socialPlatforms.filter(({ key }) => !visibleSocialPlatforms.includes(key));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {t("title")}
      </h2>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("name")}
        </label>
        <input
          type="text"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          className={inputCls}
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("about")}
        </label>
        <textarea
          value={editForm.bio}
          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
          maxLength={300}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder={t("aboutPh")}
        />
        <p className="text-xs text-gray-400 mt-1">{editForm.bio?.length ?? 0}/300</p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("location")}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedCountry?.id ?? ""}
            onChange={(e) => {
              const country = locations.find((l) => l.id === e.target.value);
              setEditForm({
                ...editForm,
                cityId: country?.cities?.[0]?.id ?? "",
                districtId: "",
              });
            }}
            className={inputCls}
          >
            <option value="">{t("selectCountry")}</option>
            {[...locations]
              .sort((a, b) =>
                a.code === "TR" ? -1 : b.code === "TR" ? 1 : a.name.localeCompare(b.name)
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <select
            value={editForm.cityId}
            onChange={(e) =>
              setEditForm({ ...editForm, cityId: e.target.value, districtId: "" })
            }
            className={inputCls}
          >
            <option value="">{t("selectCity")}</option>
            {[...citiesForCountry]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <select
            value={editForm.districtId}
            onChange={(e) =>
              setEditForm({ ...editForm, districtId: e.target.value })
            }
            className={inputCls}
            disabled={!editForm.cityId}
          >
            <option value="">{t("selectDistrict")}</option>
            {[...districtsForCity]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Gender + Birth Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("gender")}
          </label>
          <select
            value={editForm.gender}
            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
            className={inputCls}
          >
            <option value="">{t("genderUnspecified")}</option>
            <option value="MALE">{t("genderMale")}</option>
            <option value="FEMALE">{t("genderFemale")}</option>
            <option value="PREFER_NOT_TO_SAY">{t("genderPreferNot")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("birthDate")}
          </label>
          <input
            type="date"
            value={editForm.birthDate}
            onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {/* Sports */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("mySports")}
        </label>
        <div className="flex flex-wrap gap-2">
          {sports.map((s) => {
            const selected = editForm.sportIds?.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  const cur = editForm.sportIds ?? [];
                  if (selected) {
                    setEditForm({ ...editForm, sportIds: cur.filter((id) => id !== s.id) });
                  } else if (cur.length < 5) {
                    setEditForm({ ...editForm, sportIds: [...cur, s.id] });
                  } else {
                    toast.error(t("maxSportsError"));
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition border ${
                  selected
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400"
                }`}
              >
                {s.icon} {localizeSportName(s.name, locale)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("phone")}
        </label>
        <input
          type="tel"
          value={editForm.phone}
          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          className={inputCls}
          placeholder="05551234567"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("currentPassword")}
        </label>
        <input
          type="password"
          value={editForm.currentPassword}
          onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("newPassword")}
        </label>
        <input
          type="password"
          value={editForm.newPassword}
          onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
          className={inputCls}
          placeholder={t("newPasswordHint")}
        />
      </div>

      {/* Social Media */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {t("socialMedia")}
        </label>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/40 p-3 sm:p-4 space-y-3">
          {activeSocialPlatforms.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-900/30">
              {socialUi.empty}
            </div>
          )}

          {activeSocialPlatforms.map(({ key, visibilityKey, placeholder, icon, iconClass }) => (
            <div key={key} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/70 p-3 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-2xl ${iconClass}`}>
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">{key === "twitterX" ? "X" : key}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{socialUi.linkLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVisibleSocialPlatforms((prev) => prev.filter((item) => item !== key));
                    setEditForm({
                      ...editForm,
                      [key]: "",
                      [visibilityKey]: "EVERYONE",
                    } as ProfileEditForm);
                  }}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  {socialUi.remove}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{socialUi.linkLabel}</label>
                  <input
                    type="text"
                    value={(editForm as Record<string, string | undefined>)[key] ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value } as ProfileEditForm)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    placeholder={placeholder}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{socialUi.visibilityLabel}</label>
                  <select
                    value={(editForm as Record<string, string | undefined>)[visibilityKey] ?? "EVERYONE"}
                    onChange={(e) => setEditForm({ ...editForm, [visibilityKey]: e.target.value as "EVERYONE" | "FOLLOWERS" | "NOBODY" } as ProfileEditForm)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
                  >
                    {visibilityOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {availableSocialPlatforms.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSocialPicker((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <span className="text-base">+</span>
                {socialUi.add}
              </button>

              {showSocialPicker && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/70 p-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{socialUi.pickerTitle}</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSocialPlatforms.map(({ key, icon, iconClass }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setVisibleSocialPlatforms((prev) => [...prev, key]);
                          setShowSocialPicker(false);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full ${iconClass}`}>{icon}</span>
                        <span className="capitalize">{key === "twitterX" ? "X" : key}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trainer Info */}
      {isTrainer && (
        <div className="space-y-4 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 bg-blue-50/60 dark:bg-blue-950/20">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t("trainerSection")}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={editForm.trainerUniversity ?? ""}
              onChange={(e) => setEditForm({ ...editForm, trainerUniversity: e.target.value })}
              className={inputCls}
              placeholder={tProf("university")}
            />
            <input
              type="text"
              value={editForm.trainerDepartment ?? ""}
              onChange={(e) => setEditForm({ ...editForm, trainerDepartment: e.target.value })}
              className={inputCls}
              placeholder={tProf("department")}
            />
            <input
              type="text"
              value={editForm.trainerGymName ?? ""}
              onChange={(e) => setEditForm({ ...editForm, trainerGymName: e.target.value })}
              className={inputCls}
              placeholder={tProf("gymName")}
            />
            <input
              type="number"
              min={0}
              value={editForm.trainerExperienceYears ?? ""}
              onChange={(e) => setEditForm({ ...editForm, trainerExperienceYears: e.target.value })}
              className={inputCls}
              placeholder={tProf("experience")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t("lessonTypes")}</label>
            <div className="flex flex-wrap gap-2">
              {lessonTypeOptions.map((opt) => {
                const selected = (editForm.trainerLessonTypes ?? []).includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const current = editForm.trainerLessonTypes ?? [];
                      setEditForm({
                        ...editForm,
                        trainerLessonTypes: selected ? current.filter((x) => x !== opt.id) : [...current, opt.id],
                      });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={editForm.trainerProvidesEquipment ?? ""}
              onChange={(e) => setEditForm({ ...editForm, trainerProvidesEquipment: e.target.value as "yes" | "no" | "" })}
              className={inputCls}
            >
              <option value="">{t("equipmentUnspecified")}</option>
              <option value="yes">{t("equipmentYes")}</option>
              <option value="no">{t("equipmentNo")}</option>
            </select>
            <input
              type="text"
              value={editForm.trainerCertNote ?? ""}
              onChange={(e) => setEditForm({ ...editForm, trainerCertNote: e.target.value })}
              className={inputCls}
              placeholder={t("certNote")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t("branchExperience")}</label>
            <div className="space-y-2">
              {(editForm.trainerSpecializations ?? []).map((sp, idx) => (
                <div key={`${sp.sportName}-${idx}`} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={sp.sportName}
                    onChange={(e) => {
                      const next = [...(editForm.trainerSpecializations ?? [])];
                      next[idx] = { ...next[idx], sportName: e.target.value };
                      setEditForm({ ...editForm, trainerSpecializations: next });
                    }}
                    className={inputCls}
                    placeholder={t("branchName")}
                  />
                  <input
                    type="number"
                    min={0}
                    value={sp.years}
                    onChange={(e) => {
                      const next = [...(editForm.trainerSpecializations ?? [])];
                      next[idx] = { ...next[idx], years: parseInt(e.target.value || "0", 10) || 0 };
                      setEditForm({ ...editForm, trainerSpecializations: next });
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(editForm.trainerSpecializations ?? [])];
                      next.splice(idx, 1);
                      setEditForm({ ...editForm, trainerSpecializations: next });
                    }}
                    className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-xs font-semibold"
                  >
                    {t("deleteBranch")}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditForm({
                  ...editForm,
                  trainerSpecializations: [...(editForm.trainerSpecializations ?? []), { sportName: "", years: 0 }],
                })}
                className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
              >
                {t("addBranch")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button onClick={onSave} loading={saving}>
          {t("save")}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
