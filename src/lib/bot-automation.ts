import { localizeSportName, type AppLocale } from "@/lib/localized-ui";

export function mapCountryCodeToLocale(countryCode: string | null | undefined): AppLocale {
  const code = (countryCode ?? "TR").toUpperCase();

  if (["TR"].includes(code)) return "tr";
  if (["RU", "BY", "KZ", "KG"].includes(code)) return "ru";
  if (["DE", "AT", "CH"].includes(code)) return "de";
  if (["FR", "BE", "LU"].includes(code)) return "fr";
  if (["ES", "MX", "AR", "CO", "CL", "PE"].includes(code)) return "es";
  if (["JP"].includes(code)) return "ja";
  if (["KR"].includes(code)) return "ko";

  return "en";
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildBotAvatarUrl({
  gender,
  seed,
}: {
  gender?: string | null;
  seed: string;
}): string {
  // pravatar has 1..70 images; split ranges by gender for a more consistent profile style.
  const isFemale = (gender ?? "").toUpperCase() === "FEMALE";
  const min = isFemale ? 36 : 1;
  const max = isFemale ? 70 : 35;
  const span = max - min + 1;
  const avatarIndex = min + (hashSeed(seed) % span);
  return `https://i.pravatar.cc/300?img=${avatarIndex}`;
}

export function generateBotBio({
  locale,
  sportName,
  cityName,
  persona,
}: {
  locale: AppLocale;
  sportName: string;
  cityName?: string;
  persona?: string | null;
}): string {
  const localizedSport = localizeSportName(sportName || "sport", locale);
  const tone = (persona ?? "").trim().toLowerCase();

  const templates: Record<AppLocale, string[]> = {
    tr: [
      `${cityName ?? "Sehir merkezinde"} ${localizedSport} icin duzenli partner ariyorum.`,
      `${localizedSport} antrenmanlarini aksatmayan biriyle eslesmek istiyorum.`,
      `${cityName ? `${cityName} cevresinde` : "Bu hafta"} ${localizedSport} maci yapalim.`,
      `${localizedSport} icin pozitif ve dakik bir eslesme ariyorum.`,
    ],
    en: [
      `Looking for a consistent ${localizedSport} partner ${cityName ? `around ${cityName}` : "this week"}.`,
      `I enjoy structured ${localizedSport} sessions and reliable teammates.`,
      `${cityName ? `${cityName} area` : "Local area"} ${localizedSport} matches work best for me.`,
      `Open to friendly but focused ${localizedSport} matches.`,
    ],
    ru: [
      `Ищу постоянного партнера по ${localizedSport}${cityName ? ` в районе ${cityName}` : ""}.`,
      `Люблю регулярные тренировки по ${localizedSport} и пунктуальность.`,
      `Открыт к матчам по ${localizedSport} в удобное время.`,
      `Ищу спокойного и надежного партнера для ${localizedSport}.`,
    ],
    de: [
      `Ich suche einen regelmaessigen Partner fuer ${localizedSport}${cityName ? ` in ${cityName}` : ""}.`,
      `Strukturierte ${localizedSport}-Einheiten und Zuverlaessigkeit sind mir wichtig.`,
      `Offen fuer freundliche, aber fokussierte ${localizedSport}-Matches.`,
      `${localizedSport} spiele ich am liebsten mit puenktlichen Partnern.`,
    ],
    fr: [
      `Je cherche un partenaire regulier pour ${localizedSport}${cityName ? ` vers ${cityName}` : ""}.`,
      `J'aime les sessions ${localizedSport} bien organisees et ponctuelles.`,
      `Disponible pour des matchs ${localizedSport} serieux mais sympas.`,
      `Je privilegie les partenaires fiables pour ${localizedSport}.`,
    ],
    es: [
      `Busco companero constante para ${localizedSport}${cityName ? ` por ${cityName}` : ""}.`,
      `Me gustan las sesiones de ${localizedSport} organizadas y puntuales.`,
      `Abierto a partidos de ${localizedSport} con buen ambiente.`,
      `Prefiero companeros responsables para ${localizedSport}.`,
    ],
    ja: [
      `${cityName ? `${cityName}周辺で` : ""}${localizedSport}の定期パートナーを探しています。`,
      `${localizedSport}を継続して一緒に練習できる方を希望します。`,
      `礼儀正しく前向きに${localizedSport}を楽しみたいです。`,
      `${localizedSport}の練習相手を募集中です。`,
    ],
    ko: [
      `${cityName ? `${cityName} 근처에서 ` : ""}${localizedSport}를 함께할 고정 파트너를 찾고 있어요.`,
      `${localizedSport}를 꾸준히 할 수 있는 분이면 좋아요.`,
      `매너 좋고 성실한 ${localizedSport} 파트너를 원해요.`,
      `${localizedSport} 매치 환영합니다.`,
    ],
  };

  const pool = templates[locale] ?? templates.en;
  const base = pool[hashSeed(`${localizedSport}-${cityName ?? "city"}-${tone}`) % pool.length];

  if (!tone) return base;

  if (locale === "tr") return `${base} Tarz: ${tone}.`;
  if (locale === "ru") return `${base} Стиль: ${tone}.`;
  if (locale === "de") return `${base} Stil: ${tone}.`;
  if (locale === "fr") return `${base} Style: ${tone}.`;
  if (locale === "es") return `${base} Estilo: ${tone}.`;
  if (locale === "ja") return `${base} スタイル: ${tone}。`;
  if (locale === "ko") return `${base} 스타일: ${tone}.`;
  return `${base} Style: ${tone}.`;
}

export function generateListingDesc({
  name,
  sport,
  locale,
  city,
}: {
  name: string;
  sport: string;
  locale: AppLocale;
  city?: string;
}): string {
  const localizedSport = localizeSportName(sport, locale);

  const templates: Record<AppLocale, string[]> = {
    tr: [
      `Bu hafta ${localizedSport} icin partner ariyorum.`,
      `${city ? `${city} tarafinda ` : ""}${localizedSport} icin eslesmek isteyen yazabilir.`,
      `${localizedSport} icin seviyeden bagimsiz bir eslesme ariyorum.`,
      `${name} olarak ${localizedSport} icin yeni bir eslesme actim.`,
    ],
    en: [
      `Looking for a partner for ${localizedSport} this week.`,
      `${city ? `Around ${city}, ` : ""}I am open to a ${localizedSport} match.`,
      `All levels are welcome for this ${localizedSport} session.`,
      `${name} is looking for a ${localizedSport} match.`,
    ],
    ru: [
      `Ищу партнера по ${localizedSport} на этой неделе.`,
      `${city ? `В районе ${city} ` : ""}открыт к матчу по ${localizedSport}.`,
      `Для ${localizedSport} подойдёт любой уровень.`,
      `${name} ищет соперника по ${localizedSport}.`,
    ],
    de: [
      `Ich suche diese Woche einen Partner fuer ${localizedSport}.`,
      `${city ? `Im Raum ${city} ` : ""}suche ich ein Match fuer ${localizedSport}.`,
      `Bei ${localizedSport} sind alle Levels willkommen.`,
      `${name} sucht ein Match fuer ${localizedSport}.`,
    ],
    fr: [
      `Je cherche un partenaire pour ${localizedSport} cette semaine.`,
      `${city ? `Autour de ${city}, ` : ""}je suis disponible pour ${localizedSport}.`,
      `Tous les niveaux sont bienvenus pour ${localizedSport}.`,
      `${name} cherche un match de ${localizedSport}.`,
    ],
    es: [
      `Busco companero para ${localizedSport} esta semana.`,
      `${city ? `Por la zona de ${city}, ` : ""}estoy disponible para ${localizedSport}.`,
      `Todos los niveles son bienvenidos para ${localizedSport}.`,
      `${name} busca un partido de ${localizedSport}.`,
    ],
    ja: [
      `今週${localizedSport}のパートナーを募集しています。`,
      `${city ? `${city}周辺で` : ""}${localizedSport}の相手を探しています。`,
      `${localizedSport}はレベル不問で参加歓迎です。`,
      `${name}が${localizedSport}のマッチ相手を探しています。`,
    ],
    ko: [
      `이번 주 ${localizedSport} 파트너를 찾고 있어요.`,
      `${city ? `${city} 근처에서 ` : ""}${localizedSport} 매치를 원해요.`,
      `${localizedSport}는 실력과 상관없이 환영합니다.`,
      `${name} 님이 ${localizedSport} 매치 상대를 찾고 있어요.`,
    ],
  };

  const pool = templates[locale] ?? templates.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateResponseMsg(name: string, locale: AppLocale): string {
  const templates: Record<AppLocale, string[]> = {
    tr: [
      "Merhaba, ilanim ilgimi cekti. Katilmak isterim.",
      "Musaitim, istersen detaylari konusalim.",
      "Bu eslesme bana uygun gorunuyor.",
      `${name} olarak basvuruyorum, uygun olursa sevinirim.`,
    ],
    en: [
      "Hi, this listing looks great. I would like to join.",
      "I am available. We can discuss the details.",
      "This match looks like a good fit for me.",
      `${name} here, I would be happy to join if it works for you.`,
    ],
    ru: [
      "Привет, объявление заинтересовало. Хочу присоединиться.",
      "Я свободен, можем обсудить детали.",
      "Этот матч мне подходит.",
      `${name} на связи, буду рад присоединиться.`,
    ],
    de: [
      "Hallo, die Anzeige passt gut fuer mich. Ich moechte mitmachen.",
      "Ich bin verfuegbar, lass uns die Details besprechen.",
      "Das Match passt gut zu mir.",
      `${name} hier, ich waere gern dabei.`,
    ],
    fr: [
      "Bonjour, cette annonce m'interesse. Je veux participer.",
      "Je suis disponible, on peut voir les details.",
      "Ce match me convient bien.",
      `${name} ici, je serais ravi de participer.`,
    ],
    es: [
      "Hola, este anuncio me interesa. Me gustaria participar.",
      "Estoy disponible, podemos hablar de los detalles.",
      "Este partido me viene bien.",
      `${name} por aqui, encantado de unirme.`,
    ],
    ja: [
      "こんにちは、この募集に参加したいです。",
      "参加可能です。詳細を相談しましょう。",
      "このマッチは自分に合っています。",
      `${name}です。参加できると嬉しいです。`,
    ],
    ko: [
      "안녕하세요, 이 모집에 참여하고 싶어요.",
      "가능한 시간 맞춰서 자세히 이야기해요.",
      "이 매치는 저에게 잘 맞습니다.",
      `${name}입니다. 참여할 수 있으면 좋겠어요.`,
    ],
  };

  const pool = templates[locale] ?? templates.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateShadowMatchText({
  locale,
  listingBotName,
  responderBotName,
  sportName,
  cityName,
}: {
  locale: AppLocale;
  listingBotName: string;
  responderBotName: string;
  sportName: string;
  cityName?: string;
}): string {
  const localizedSport = localizeSportName(sportName, locale);

  const templates: Record<AppLocale, string> = {
    tr: `${listingBotName} ve ${responderBotName} bugun ${localizedSport} macini tamamladi!${cityName ? ` (${cityName})` : ""}`,
    en: `${listingBotName} and ${responderBotName} completed a ${localizedSport} match today!${cityName ? ` (${cityName})` : ""}`,
    ru: `${listingBotName} и ${responderBotName} сегодня завершили матч по ${localizedSport}!${cityName ? ` (${cityName})` : ""}`,
    de: `${listingBotName} und ${responderBotName} haben heute ein ${localizedSport}-Match abgeschlossen!${cityName ? ` (${cityName})` : ""}`,
    fr: `${listingBotName} et ${responderBotName} ont termine un match de ${localizedSport} aujourd'hui !${cityName ? ` (${cityName})` : ""}`,
    es: `${listingBotName} y ${responderBotName} completaron hoy un partido de ${localizedSport}!${cityName ? ` (${cityName})` : ""}`,
    ja: `${listingBotName}さんと${responderBotName}さんが今日、${localizedSport}のマッチを完了しました！${cityName ? ` (${cityName})` : ""}`,
    ko: `${listingBotName}님과 ${responderBotName}님이 오늘 ${localizedSport} 매치를 완료했어요!${cityName ? ` (${cityName})` : ""}`,
  };

  return templates[locale] ?? templates.en;
}

const COUNTRY_COORDINATE_CENTERS: Record<string, { lat: number; lon: number }> = {
  TR: { lat: 39.0, lon: 35.0 },
  DE: { lat: 51.2, lon: 10.4 },
  FR: { lat: 46.2, lon: 2.2 },
  ES: { lat: 40.4, lon: -3.7 },
  GB: { lat: 54.0, lon: -2.0 },
  RU: { lat: 55.8, lon: 37.6 },
  JP: { lat: 35.7, lon: 139.7 },
  KR: { lat: 37.6, lon: 127.0 },
  US: { lat: 39.8, lon: -98.6 },
  CA: { lat: 56.1, lon: -106.3 },
  BR: { lat: -14.2, lon: -51.9 },
  AR: { lat: -38.4, lon: -63.6 },
  IN: { lat: 21.1, lon: 78.0 },
  AU: { lat: -25.2, lon: 133.8 },
  NL: { lat: 52.1, lon: 5.3 },
  IT: { lat: 41.9, lon: 12.6 },
  GR: { lat: 39.1, lon: 22.9 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function estimateBotCoordinates({
  citySeed,
  countryCode,
}: {
  citySeed: string;
  countryCode?: string | null;
}): { latitude: number; longitude: number } {
  const code = (countryCode ?? "TR").toUpperCase();
  const center = COUNTRY_COORDINATE_CENTERS[code] ?? COUNTRY_COORDINATE_CENTERS.TR;

  const latHash = hashSeed(`${citySeed}-lat`);
  const lonHash = hashSeed(`${citySeed}-lon`);

  const latOffset = ((latHash % 1000) / 1000 - 0.5) * 0.8;
  const lonOffset = ((lonHash % 1000) / 1000 - 0.5) * 1.2;

  const latitude = Number(clamp(center.lat + latOffset, -85, 85).toFixed(6));
  const longitude = Number(clamp(center.lon + lonOffset, -179, 179).toFixed(6));

  return { latitude, longitude };
}
