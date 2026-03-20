import HomeClient from "@/components/HomeClient";
import {
  getInitialListings,
  getInitialSports,
  getPopularListings,
} from "@/lib/server-data";

// v1.3.0 - Locations removed from SSR props (5030 cities = 1-2 MB JSON payload).
// FilterBar loads locations client-side via /api/locations (24h cache, fast after first hit).
// SSR now only sends: 12 listings + 6 recommendations + 20 sports → payload ~80 KB.
export default async function HomePage() {
  // 3 bağımsız sorgu aynı anda başlar — locations artık SSR'dan kaldırıldı.
  const [sports, recommendations, listingsData] = await Promise.all([
    getInitialSports(),
    getPopularListings(6),
    getInitialListings(),
  ]);

  return (
    <HomeClient
      initialListings={listingsData.listings}
      initialTotal={listingsData.total}
      initialPageSize={listingsData.pageSize}
      initialRecommendations={recommendations}
      initialSports={sports}
    />
  );
}

// ISR: 60 saniyede bir yeniden validate et
export const revalidate = 60;

