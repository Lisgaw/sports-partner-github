"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import { localizeListingType, localizeSportName, resolveAppLocale } from "@/lib/localized-ui";
import "leaflet/dist/leaflet.css";

// SSR devre dışı — Leaflet sadece tarayıcıda çalışır
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-xl">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Harita yükleniyor...</p>
      </div>
    </div>
  ),
});

interface MapListing {
  id: string;
  description: string | null;
  type: string;
  latitude: number;
  longitude: number;
  sport: { name: string; icon: string } | null;
  user: { id: string; name: string | null; avatarUrl: string | null };
  district: { name: string; city: { name: string } } | null;
  city: { name: string; country: { name: string } | null } | null;
}

const TYPE_LABELS: Record<string, string> = {
  RIVAL: "Rakip",
  PARTNER: "Ortak",
  TRAINER: "Antrenör",
  EQUIPMENT: "Ekipman",
  VENUE_RENTAL: "Saha Kiralama",
  VENUE_MEMBERSHIP: "Üyelik",
  VENUE_CLASS: "Ders/Kurs",
  VENUE_PRODUCT: "Ürün",
  VENUE_EVENT: "Etkinlik",
  VENUE_SERVICE: "Hizmet",
};

const TYPE_COLORS: Record<string, string> = {
  RIVAL: "#ef4444",
  PARTNER: "#3b82f6",
  TRAINER: "#8b5cf6",
  EQUIPMENT: "#f59e0b",
  VENUE_RENTAL: "#10b981",
  VENUE_MEMBERSHIP: "#06b6d4",
  VENUE_CLASS: "#f97316",
  VENUE_PRODUCT: "#84cc16",
  VENUE_EVENT: "#ec4899",
  VENUE_SERVICE: "#6366f1",
};

export default function HaritaPage() {
  const locale = useLocale();
  const safeLocale = resolveAppLocale(locale);
  const [listings, setListings] = useState<MapListing[]>([]);
  const [filtered, setFiltered] = useState<MapListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const textByLocale = {
    tr: {
      title: "İlan Haritası",
      loading: "Yükleniyor...",
      shown: "ilan haritada gösteriliyor",
      useLocation: "Konumum",
      noListingsTitle: "Haritada ilan yok",
      noListingsDesc: "Henüz konum bilgisi paylaşan aktif ilan yok.",
      nearbyTitle: "Yakındaki İlanlar",
      enableLocation: "Yakındaki ilanları görmek için konumunu paylaş.",
      noNearby: "Konumuna yakın aktif ilan bulunamadı.",
      approxDistance: "yaklaşık",
      openListing: "İlanı Aç",
      activeAll: "Tümü",
    },
    en: {
      title: "Listing Map",
      loading: "Loading...",
      shown: "listings shown on the map",
      useLocation: "My Location",
      noListingsTitle: "No listings on the map",
      noListingsDesc: "There are no active listings sharing location data yet.",
      nearbyTitle: "Nearby Listings",
      enableLocation: "Share your location to see nearby listings.",
      noNearby: "No active listings found near your location.",
      approxDistance: "about",
      openListing: "Open Listing",
      activeAll: "All",
    },
    ru: {
      title: "Карта объявлений",
      loading: "Загрузка...",
      shown: "объявлений показано на карте",
      useLocation: "Моё местоположение",
      noListingsTitle: "На карте нет объявлений",
      noListingsDesc: "Пока нет активных объявлений с координатами.",
      nearbyTitle: "Объявления рядом",
      enableLocation: "Поделитесь геопозицией, чтобы увидеть объявления рядом.",
      noNearby: "Рядом с вами активных объявлений не найдено.",
      approxDistance: "примерно",
      openListing: "Открыть объявление",
      activeAll: "Все",
    },
    de: {
      title: "Listing Map",
      loading: "Loading...",
      shown: "listings shown on the map",
      useLocation: "My Location",
      noListingsTitle: "No listings on the map",
      noListingsDesc: "There are no active listings sharing location data yet.",
      nearbyTitle: "Nearby Listings",
      enableLocation: "Share your location to see nearby listings.",
      noNearby: "No active listings found near your location.",
      approxDistance: "about",
      openListing: "Open Listing",
      activeAll: "All",
    },
    fr: {
      title: "Listing Map",
      loading: "Loading...",
      shown: "listings shown on the map",
      useLocation: "My Location",
      noListingsTitle: "No listings on the map",
      noListingsDesc: "There are no active listings sharing location data yet.",
      nearbyTitle: "Nearby Listings",
      enableLocation: "Share your location to see nearby listings.",
      noNearby: "No active listings found near your location.",
      approxDistance: "about",
      openListing: "Open Listing",
      activeAll: "All",
    },
    es: {
      title: "Listing Map",
      loading: "Loading...",
      shown: "listings shown on the map",
      useLocation: "My Location",
      noListingsTitle: "No listings on the map",
      noListingsDesc: "There are no active listings sharing location data yet.",
      nearbyTitle: "Nearby Listings",
      enableLocation: "Share your location to see nearby listings.",
      noNearby: "No active listings found near your location.",
      approxDistance: "about",
      openListing: "Open Listing",
      activeAll: "All",
    },
    ja: {
      title: "Listing Map",
      loading: "Loading...",
      shown: "listings shown on the map",
      useLocation: "My Location",
      noListingsTitle: "No listings on the map",
      noListingsDesc: "There are no active listings sharing location data yet.",
      nearbyTitle: "Nearby Listings",
      enableLocation: "Share your location to see nearby listings.",
      noNearby: "No active listings found near your location.",
      approxDistance: "about",
      openListing: "Open Listing",
      activeAll: "All",
    },
    ko: {
      title: "Listing Map",
      loading: "Loading...",
      shown: "listings shown on the map",
      useLocation: "My Location",
      noListingsTitle: "No listings on the map",
      noListingsDesc: "There are no active listings sharing location data yet.",
      nearbyTitle: "Nearby Listings",
      enableLocation: "Share your location to see nearby listings.",
      noNearby: "No active listings found near your location.",
      approxDistance: "about",
      openListing: "Open Listing",
      activeAll: "All",
    },
  } as const;

  const text = textByLocale[safeLocale] ?? {
    title: "Listing Map",
    loading: "Loading...",
    shown: "listings shown on the map",
    useLocation: "My Location",
    noListingsTitle: "No listings on the map",
    noListingsDesc: "There are no active listings sharing location data yet.",
    nearbyTitle: "Nearby Listings",
    enableLocation: "Share your location to see nearby listings.",
    noNearby: "No active listings found near your location.",
    approxDistance: "about",
    openListing: "Open Listing",
    activeAll: "All",
  };

  const buildLocationText = (listing: MapListing) => {
    if (listing.district) {
      return `${listing.district.city.name}, ${listing.district.name}`;
    }
    if (listing.city?.country?.name) {
      return `${listing.city.country.name}, ${listing.city.name}`;
    }
    return listing.city?.name ?? "";
  };

  const getDistanceMeters = useCallback((from: [number, number], to: [number, number]) => {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRadians(to[0] - from[0]);
    const dLon = toRadians(to[1] - from[1]);
    const lat1 = toRadians(from[0]);
    const lat2 = toRadians(to[0]);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  const formatDistance = useCallback((meters: number) => {
    const safeMeters = Math.max(500, Math.round(meters / 100) * 100);
    return safeMeters >= 1000 ? `${(safeMeters / 1000).toFixed(1)} km` : `${safeMeters} m`;
  }, []);

  useEffect(() => {
    fetch("/api/listings/map")
      .then((r) => r.json())
      .then((data) => {
        setListings(data.listings ?? []);
        setFiltered(data.listings ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filterByType = useCallback((type: string | null) => {
    setActiveType(type);
    if (!type) {
      setFiltered(listings);
    } else {
      setFiltered(listings.filter((l) => l.type === type));
    }
  }, [listings]);

  const getMyLocation = useCallback(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const nearbyListings = useMemo(() => {
    if (!userLocation) return [];
    return filtered
      .map((listing) => ({
        ...listing,
        distanceMeters: getDistanceMeters(userLocation, [listing.latitude, listing.longitude]),
      }))
      .sort((left, right) => left.distanceMeters - right.distanceMeters)
      .slice(0, 8);
  }, [filtered, getDistanceMeters, userLocation]);

  // Haritada var olan ilan tipleri
  const availableTypes = [...new Set(listings.map((l) => l.type))];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      {/* Başlık ve filtreler */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">🗺️ {text.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? text.loading : `${filtered.length} ${text.shown}`}
            </p>
          </div>
          <button
            onClick={getMyLocation}
            className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
            </svg>
            {text.useLocation}
          </button>
        </div>

        {/* Tip filtreleri */}
        {availableTypes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => filterByType(null)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeType === null
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {text.activeAll} ({listings.length})
            </button>
            {availableTypes.map((type) => {
              const count = listings.filter((l) => l.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => filterByType(type)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    activeType === type ? "text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  }`}
                  style={activeType === type ? { backgroundColor: TYPE_COLORS[type] ?? "#6b7280" } : {}}
                >
                  {localizeListingType(type, locale) ?? TYPE_LABELS[type] ?? type} ({count})
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{text.nearbyTitle}</h2>
            {userLocation && nearbyListings.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{nearbyListings.length}</span>
            )}
          </div>
          {!userLocation ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{text.enableLocation}</p>
          ) : nearbyListings.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{text.noNearby}</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {nearbyListings.map((listing) => (
                <Link key={listing.id} href={`/ilan/${listing.id}`} className="rounded-lg border border-gray-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {listing.sport?.icon} {listing.sport?.name ? localizeSportName(listing.sport.name, locale) : ""}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {localizeListingType(listing.type, locale)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {text.approxDistance} {formatDistance(listing.distanceMeters)}
                    </span>
                  </div>
                  {buildLocationText(listing) && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">📍 {buildLocationText(listing)}</p>
                  )}
                  <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
                    {listing.description || `${localizeSportName(listing.sport?.name ?? "", locale)} ${text.openListing}`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Harita */}
      <div className="flex-1 px-4 pb-4 min-h-0">
        {!loading && listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{text.noListingsTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {text.noListingsDesc}
            </p>
          </div>
        ) : (
          <div className="h-full rounded-xl overflow-hidden shadow-lg">
            <MapComponent
              listings={filtered}
              center={userLocation ?? [39.9, 32.8]}
              zoom={userLocation ? 12 : 6}
            />
          </div>
        )}
      </div>
    </div>
  );
}
