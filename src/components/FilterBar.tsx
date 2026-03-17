"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocations, useSports } from "@/hooks/useLocations";
import { useDebounce } from "@/hooks/useDebounce";
import LocationSelector from "./LocationSelector";
import { useLocale, useTranslations } from "next-intl";
import { localizeSportName } from "@/lib/localized-ui";
import type { Country, Sport } from "@/types";

type FilterBarProps = {
  onFilterChange: (filters: Record<string, string>) => void;
  initialLocations?: Country[];
  initialSports?: Sport[];
};

export default function FilterBar({ onFilterChange, initialLocations, initialSports }: FilterBarProps) {
  const locale = useLocale();
  const t = useTranslations("filterBar");

  // Use SSR data if provided, otherwise fallback to client-side fetch
  const { locations: fetchedLocations, error: locError } = useLocations();
  const { sports: fetchedSports, error: sportError } = useSports();
  
  const locations = initialLocations?.length ? initialLocations : fetchedLocations;
  const sports = initialSports?.length ? initialSports : fetchedSports;

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [datePreset, setDatePreset] = useState("");

  const cities = locations.find((l) => l.id === selectedCountry)?.cities || [];
  const districts = cities.find((c) => c.id === selectedCity)?.districts || [];

  const isFirstRender = useRef(true);

  // Prefer the visitor's country from Vercel geo headers and fall back to Turkey.
  useEffect(() => {
    if (locations.length === 0 || selectedCountry) {
      return;
    }

    let cancelled = false;

    const applyCountrySelection = async () => {
      try {
        const response = await fetch("/api/geo", { cache: "no-store" });
        const data = (await response.json()) as { country?: string };
        const code = data.country?.toUpperCase();
        const matchedCountry = locations.find((location) => location.code?.toUpperCase() === code);
        const fallbackCountry = locations.find((location) => location.code?.toUpperCase() === "TR")
          ?? locations.find((location) => location.name === "Türkiye");

        if (!cancelled) {
          const initialCountry = matchedCountry ?? fallbackCountry;
          if (initialCountry) {
            setSelectedCountry(initialCountry.id);
          }
        }
      } catch {
        if (!cancelled) {
          const fallbackCountry = locations.find((location) => location.code?.toUpperCase() === "TR")
            ?? locations.find((location) => location.name === "Türkiye");
          if (fallbackCountry) {
            setSelectedCountry(fallbackCountry.id);
          }
        }
      }
    };

    void applyCountrySelection();

    return () => {
      cancelled = true;
    };
  }, [locations, selectedCountry]);

  const filterInput = useMemo(
    () => ({ selectedSport, selectedDistrict, selectedCity, selectedCountry, selectedLevel, selectedType, minPrice, maxPrice, isRecurring, datePreset }),
    [selectedSport, selectedDistrict, selectedCity, selectedCountry, selectedLevel, selectedType, minPrice, maxPrice, isRecurring, datePreset]
  );

  const debouncedFilters = useDebounce(filterInput, 300);

  useEffect(() => {
    // İlk renderda boş filtre ile yükleme yap, sonraki değişikliklerde debounce uygula
    const filters: Record<string, string> = {};
    if (debouncedFilters.selectedSport) filters.sportId = debouncedFilters.selectedSport;
    if (debouncedFilters.selectedDistrict) filters.districtId = debouncedFilters.selectedDistrict;
    if (debouncedFilters.selectedCity) filters.cityId = debouncedFilters.selectedCity;
    if (debouncedFilters.selectedCountry) filters.countryId = debouncedFilters.selectedCountry;
    if (debouncedFilters.selectedLevel) filters.level = debouncedFilters.selectedLevel;
    if (debouncedFilters.selectedType) filters.type = debouncedFilters.selectedType;
    if (debouncedFilters.minPrice) filters.minPrice = debouncedFilters.minPrice;
    if (debouncedFilters.maxPrice) filters.maxPrice = debouncedFilters.maxPrice;
    if (debouncedFilters.isRecurring) filters.isRecurring = "true";
    if (debouncedFilters.datePreset) {
      const now = new Date();
      if (debouncedFilters.datePreset === "today") {
        const end = new Date(now); end.setHours(23, 59, 59, 999);
        filters.dateFrom = now.toISOString();
        filters.dateTo = end.toISOString();
      } else if (debouncedFilters.datePreset === "week") {
        const end = new Date(now); end.setDate(now.getDate() + 7);
        filters.dateFrom = now.toISOString();
        filters.dateTo = end.toISOString();
      } else if (debouncedFilters.datePreset === "weekend") {
        const day = now.getDay();
        const daysToSat = day === 6 ? 0 : (6 - day);
        const sat = new Date(now); sat.setDate(now.getDate() + daysToSat); sat.setHours(0, 0, 0, 0);
        const sun = new Date(sat); sun.setDate(sat.getDate() + 1); sun.setHours(23, 59, 59, 999);
        filters.dateFrom = sat.toISOString();
        filters.dateTo = sun.toISOString();
      }
    }
    onFilterChange(filters);
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  const resetFilters = () => {
    setSelectedCountry("");
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedSport("");
    setSelectedLevel("");
    setSelectedType("");
    setMinPrice("");
    setMaxPrice("");
    setIsRecurring(false);
    setDatePreset("");
  };

  const selectClass =
    "border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:opacity-60 transition";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
          {t("title")}
        </h2>
        <div className="flex items-center gap-3">
          {(locError || sportError) && (
            <span className="text-xs text-red-500">{locError || sportError}</span>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            aria-label={t("clearAria")}
          >
            {t("clear")}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Konum Seçimi (Ülke, Şehir, İlçe) */}
        <LocationSelector
          countryId={selectedCountry}
          cityId={selectedCity}
          districtId={selectedDistrict}
          onChange={(updates) => {
            if (updates.countryId !== undefined) setSelectedCountry(updates.countryId);
            if (updates.cityId !== undefined) setSelectedCity(updates.cityId);
            if (updates.districtId !== undefined) setSelectedDistrict(updates.districtId);
          }}
          showLabels={false}
          className="contents"
          selectClass={selectClass}
        />

        {/* Spor */}
        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          className={selectClass}
          aria-label={t("sportAria")}
        >
          <option value="">{t("sport")}</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {localizeSportName(s.name, locale)}
            </option>
          ))}
        </select>

        {/* Seviye */}
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className={selectClass}
          aria-label={t("levelAria")}
        >
          <option value="">{t("level")}</option>
          <option value="BEGINNER">{t("beginner")}</option>
          <option value="INTERMEDIATE">{t("intermediate")}</option>
          <option value="ADVANCED">{t("advanced")}</option>
        </select>

        {/* Tip */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className={selectClass}
          aria-label={t("typeAria")}
        >
          <option value="">{t("type")}</option>
          <optgroup label={t("individual")}>
            <option value="RIVAL">{t("rival")}</option>
            <option value="PARTNER">{t("partner")}</option>
            <option value="TRAINER">{t("trainer")}</option>
            <option value="EQUIPMENT">{t("equipment")}</option>
          </optgroup>
          <optgroup label={t("verifiedTrainer")}>
            <option value="VENUE_MEMBERSHIP">{t("venueMembership")}</option>
            <option value="VENUE_CLASS">{t("venueClass")}</option>
            <option value="VENUE_PRODUCT">{t("venueProduct")}</option>
            <option value="VENUE_SERVICE">{t("venueService")}</option>
          </optgroup>
        </select>
      </div>

      {/* Satır 2: Hızlı tarih seçenekleri + fiyat aralığı + tekrarlayan */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {/* Hızlı Tarih */}
        <div className="flex gap-1">
          {([{ id: "today", label: t("today") }, { id: "week", label: t("week") }, { id: "weekend", label: t("weekend") }] as const).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setDatePreset(prev => prev === p.id ? "" : p.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition font-medium ${
                datePreset === p.id
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400 dark:hover:border-emerald-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Fiyat Aralığı — yalnızca EQUIPMENT veya TRAINER seçiliyken ya da tip seçilmemişse */}
        {(!selectedType || selectedType === "EQUIPMENT" || selectedType === "TRAINER" || selectedType.startsWith("VENUE_")) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t("price")}</span>
            <input
              type="number"
              min={0}
              placeholder={t("priceMin")}
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <span className="text-xs text-gray-400">—</span>
            <input
              type="number"
              min={0}
              placeholder={t("priceMax")}
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        )}

        {/* Tekrarlayan Etkinlik */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
            className="accent-emerald-500 w-4 h-4"
          />
          <span className="text-xs text-gray-600 dark:text-gray-300">{t("recurring")}</span>
        </label>
      </div>
    </div>
  );
}
