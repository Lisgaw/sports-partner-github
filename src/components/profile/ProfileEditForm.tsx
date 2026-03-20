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
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditFormPanel({
  editForm,
  setEditForm,
  sports,
  locations,
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
      key: "youtube",
      visibilityKey: "youtubeVisibility",
      placeholder: `YouTube ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
      iconClass: "bg-[#FF0000] text-white",
    },
    {
      key: "linkedin",
      visibilityKey: "linkedinVisibility",
      placeholder: `LinkedIn ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
      iconClass: "bg-[#0A66C2] text-white",
    },
    {
      key: "discord",
      visibilityKey: "discordVisibility",
      placeholder: `Discord ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.024.015.045.031.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>,
      iconClass: "bg-[#5865F2] text-white",
    },
    {
      key: "twitch",
      visibilityKey: "twitchVisibility",
      placeholder: `Twitch ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>,
      iconClass: "bg-[#9146FF] text-white",
    },
    {
      key: "snapchat",
      visibilityKey: "snapchatVisibility",
      placeholder: `Snapchat ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.07.03.194.083.345.083.22 0 .49-.087.739-.292.108-.085.249-.107.373-.057.124.051.2.168.2.31 0 .25-.156.49-.484.707-.21.137-.557.255-.876.369-.19.074-.382.136-.527.214.11.23.304.525.615.84.532.538 1.3.951 2.14 1.032.176.019.315.156.32.331.003.12-.005.279-.047.342-.17.292-.463.447-.773.587-.265.12-.607.212-1.025.32-.19.044-.45.1-.668.143-.27.055-.48.208-.51.381-.03.17-.04.32.004.427.025.067.045.122.051.147.044.082.077.164.072.228-.007.15-.152.277-.313.277-.086 0-.144-.017-.208-.042-.3-.106-.562-.172-.821-.192-.24-.017-.481.006-.733.071-.396.098-.778.337-1.145.562-.566.348-1.155.711-1.932.711-.756 0-1.334-.35-1.89-.685-.376-.226-.753-.466-1.158-.567-.261-.066-.512-.09-.762-.07-.26.02-.525.088-.832.196-.064.025-.117.038-.195.038-.168 0-.313-.13-.32-.285-.006-.074.026-.157.073-.24.007-.021.026-.074.051-.141.044-.104.032-.25.005-.421-.04-.175-.248-.327-.52-.381-.21-.04-.47-.097-.652-.142-.427-.11-.768-.2-1.028-.32-.31-.14-.604-.295-.773-.587-.042-.063-.05-.222-.047-.342.005-.175.144-.312.32-.33.84-.082 1.607-.495 2.14-1.033.31-.315.504-.61.614-.84-.145-.078-.337-.14-.527-.215-.32-.113-.666-.23-.876-.368-.328-.218-.484-.458-.484-.707 0-.142.076-.26.2-.31.123-.05.265-.027.372.057.25.205.52.292.739.292.152 0 .275-.053.346-.084l-.03-.51c-.104-1.628-.23-3.654.3-4.847C7.858 1.069 11.215.793 12.206.793z"/></svg>,
      iconClass: "bg-[#FFFC00] text-black",
    },
    {
      key: "litmatch",
      visibilityKey: "litmatchVisibility",
      placeholder: `Litmatch ${t("userHandle")}`,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>,
      iconClass: "bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white",
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
      .filter(({ key }) => Boolean((editForm as unknown as Record<string, unknown>)[key]))
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
                    value={(editForm as unknown as Record<string, string | undefined>)[key] ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value } as ProfileEditForm)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    placeholder={placeholder}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{socialUi.visibilityLabel}</label>
                  <select
                    value={(editForm as unknown as Record<string, string | undefined>)[visibilityKey] ?? "EVERYONE"}
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
