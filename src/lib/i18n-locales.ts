export const APP_LOCALES = ["tr", "en", "ru", "de", "fr", "es", "ja", "ko"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];
