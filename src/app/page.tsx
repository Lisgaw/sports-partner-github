import HomeClient from "@/components/HomeClient";
import {
  getInitialListings,
  getInitialLocations,
  getInitialSports,
  getPopularListings,
} from "@/lib/server-data";

// v1.1.2 - Force deployment trigger
export default async function HomePage() {
  // Batch 1: bağımsız sorgular paralel çalışır (hiçbiri diğerini beklemez)
  const [locations, sports, recommendations] = await Promise.all([
    getInitialLocations(),
    getInitialSports(),
    getPopularListings(6),
  ]);

  // Varsayılan açılış: dünya genelindeki ilanlar
  const listingsData = await getInitialListings();

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
