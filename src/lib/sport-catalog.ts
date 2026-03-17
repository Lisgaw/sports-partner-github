import type { AppLocale } from "@/lib/i18n-locales";

export type SportCode =
  | "sport_football"
  | "sport_basketball"
  | "sport_tennis"
  | "sport_volleyball"
  | "sport_table_tennis"
  | "sport_swimming"
  | "sport_running"
  | "sport_walking"
  | "sport_cycling"
  | "sport_skate"
  | "sport_squash"
  | "sport_pickleball"
  | "sport_padel"
  | "sport_fishing"
  | "sport_hiking"
  | "sport_billiards"
  | "sport_darts"
  | "sport_yoga"
  | "sport_pilates"
  | "sport_dance"
  | "sport_fitness";

const SPORT_ALIASES: Record<string, SportCode> = {
  // TR names from DB seeds
  futbol: "sport_football",
  basketbol: "sport_basketball",
  tenis: "sport_tennis",
  voleybol: "sport_volleyball",
  "masa tenisi": "sport_table_tennis",
  yuzme: "sport_swimming",
  kosu: "sport_running",
  yuruyus: "sport_walking",
  bisiklet: "sport_cycling",
  "kaykay / paten": "sport_skate",
  squash: "sport_squash",
  pickleball: "sport_pickleball",
  padel: "sport_padel",
  "balik tutma": "sport_fishing",
  "hiking (doga yuruyusu)": "sport_hiking",
  bilardo: "sport_billiards",
  dart: "sport_darts",
  yoga: "sport_yoga",
  pilates: "sport_pilates",
  dans: "sport_dance",
  fitness: "sport_fitness",

  // EN aliases for resilience
  football: "sport_football",
  soccer: "sport_football",
  basketball: "sport_basketball",
  "table tennis": "sport_table_tennis",
  swimming: "sport_swimming",
  running: "sport_running",
  walking: "sport_walking",
  cycling: "sport_cycling",
  "skateboarding / rollerblading": "sport_skate",
  fishing: "sport_fishing",
  hiking: "sport_hiking",
  billiards: "sport_billiards",
  darts: "sport_darts",
  dance: "sport_dance",
};

const SPORT_LABELS_BY_CODE: Record<SportCode, Partial<Record<AppLocale, string>>> = {
  sport_football: { tr: "Futbol", en: "Football", ru: "Футбол", de: "Fussball", fr: "Football", es: "Futbol", ja: "サッカー", ko: "축구" },
  sport_basketball: { tr: "Basketbol", en: "Basketball", ru: "Баскетбол", de: "Basketball", fr: "Basket", es: "Baloncesto", ja: "バスケットボール", ko: "농구" },
  sport_tennis: { tr: "Tenis", en: "Tennis", ru: "Теннис", de: "Tennis", fr: "Tennis", es: "Tenis", ja: "テニス", ko: "테니스" },
  sport_volleyball: { tr: "Voleybol", en: "Volleyball", ru: "Волейбол", de: "Volleyball", fr: "Volley", es: "Voleibol", ja: "バレーボール", ko: "배구" },
  sport_table_tennis: { tr: "Masa Tenisi", en: "Table Tennis", ru: "Настольный теннис", de: "Tischtennis", fr: "Tennis de table", es: "Tenis de mesa", ja: "卓球", ko: "탁구" },
  sport_swimming: { tr: "Yuzme", en: "Swimming", ru: "Плавание", de: "Schwimmen", fr: "Natation", es: "Natacion", ja: "水泳", ko: "수영" },
  sport_running: { tr: "Kosu", en: "Running", ru: "Бег", de: "Laufen", fr: "Course", es: "Running", ja: "ランニング", ko: "러닝" },
  sport_walking: { tr: "Yuruyus", en: "Walking", ru: "Ходьба", de: "Spazieren", fr: "Marche", es: "Caminata", ja: "ウォーキング", ko: "걷기" },
  sport_cycling: { tr: "Bisiklet", en: "Cycling", ru: "Велоспорт", de: "Radfahren", fr: "Cyclisme", es: "Ciclismo", ja: "サイクリング", ko: "사이클링" },
  sport_skate: { tr: "Kaykay / Paten", en: "Skateboarding / Rollerblading", ru: "Скейт / Ролики", de: "Skateboard / Inlineskaten", fr: "Skate / Roller", es: "Skate / Patines", ja: "スケートボード / ローラー", ko: "스케이트보드 / 롤러" },
  sport_squash: { tr: "Squash", en: "Squash", ru: "Сквош", de: "Squash", fr: "Squash", es: "Squash", ja: "スカッシュ", ko: "스쿼시" },
  sport_pickleball: { tr: "Pickleball", en: "Pickleball", ru: "Пиклбол", de: "Pickleball", fr: "Pickleball", es: "Pickleball", ja: "ピックルボール", ko: "피클볼" },
  sport_padel: { tr: "Padel", en: "Padel", ru: "Падел", de: "Padel", fr: "Padel", es: "Padel", ja: "パデル", ko: "파델" },
  sport_fishing: { tr: "Balik Tutma", en: "Fishing", ru: "Рыбалка", de: "Angeln", fr: "Peche", es: "Pesca", ja: "釣り", ko: "낚시" },
  sport_hiking: { tr: "Doga Yuruyusu", en: "Hiking", ru: "Поход", de: "Wandern", fr: "Randonnee", es: "Senderismo", ja: "ハイキング", ko: "하이킹" },
  sport_billiards: { tr: "Bilardo", en: "Billiards", ru: "Бильярд", de: "Billard", fr: "Billard", es: "Billar", ja: "ビリヤード", ko: "당구" },
  sport_darts: { tr: "Dart", en: "Darts", ru: "Дартс", de: "Darts", fr: "Flechettes", es: "Dardos", ja: "ダーツ", ko: "다트" },
  sport_yoga: { tr: "Yoga", en: "Yoga", ru: "Йога", de: "Yoga", fr: "Yoga", es: "Yoga", ja: "ヨガ", ko: "요가" },
  sport_pilates: { tr: "Pilates", en: "Pilates", ru: "Пилатес", de: "Pilates", fr: "Pilates", es: "Pilates", ja: "ピラティス", ko: "필라테스" },
  sport_dance: { tr: "Dans", en: "Dance", ru: "Танцы", de: "Tanz", fr: "Danse", es: "Baile", ja: "ダンス", ko: "댄스" },
  sport_fitness: { tr: "Fitness", en: "Fitness", ru: "Фитнес", de: "Fitness", fr: "Fitness", es: "Fitness", ja: "フィットネス", ko: "피트니스" },
};

function normalizeName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[ı]/g, "i")
    .replace(/[İ]/g, "i")
    .replace(/[ş]/g, "s")
    .replace(/[Ş]/g, "s")
    .replace(/[ğ]/g, "g")
    .replace(/[Ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[Ü]/g, "u")
    .replace(/[ö]/g, "o")
    .replace(/[Ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[Ç]/g, "c");
}

export function resolveSportCode(input?: string | null): SportCode | null {
  if (!input) return null;

  const normalized = normalizeName(input);
  return SPORT_ALIASES[normalized] ?? null;
}

export function localizeSportByCode(
  sportCode: SportCode,
  locale: AppLocale
): string {
  const labels = SPORT_LABELS_BY_CODE[sportCode];
  return labels[locale] ?? labels.en ?? labels.tr ?? sportCode;
}

export function localizeSportFromDbName(
  dbName: string,
  locale: AppLocale
): string {
  const code = resolveSportCode(dbName);
  if (!code) return dbName;

  return localizeSportByCode(code, locale);
}
