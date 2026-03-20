import HomeClient from "@/components/HomeClient";
import {
  getInitialListings,
  getInitialLocations,
  getInitialSports,
  getPopularListings,
} from "@/lib/server-data";

// v1.2.0 - All data fetches parallel; all functions cached
export default async function HomePage() {
  // 4 bağımsız sorgu aynı anda başlar — hiçbiri diğerini beklemez.
  // getInitialListings ve getPopularListings artık withCache ile sarılı:
  // DB'ye max 1 kez/60s vurur, kalan tüm istekler bellekten (<1ms) döner.
  const [locations, sports, recommendations, listingsData] = await Promise.all([
    getInitialLocations(),
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
      initialLocations={locations}
      initialSports={sports}
    />
  );
}

// ISR: 60 saniyede bir yeniden validate et
export const revalidate = 60;
