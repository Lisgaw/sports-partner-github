-- Listing sorgu performans indeksleri
-- 
-- getInitialListings ORDER BY isQuick DESC, dateTime ASC için:
-- WHERE status='OPEN' AND (expiresAt IS NULL OR expiresAt > now) AND (type IN (...) OR dateTime >= now)
-- isQuick kolonuna mevcut hiç indeks yok; bileşik indeks ile planner'a ORDER BY maliyeti düşürülür.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Listing_status_isQuick_dateTime_idx"
  ON "Listing"("status", "isQuick" DESC, "dateTime" ASC);

-- getPopularListings ORDER BY responses._count DESC, createdAt DESC için:
-- Oluşturulma tarihi bazlı sıralama için indeks (status prefix ile)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Listing_status_createdAt_idx"
  ON "Listing"("status", "createdAt" DESC);

-- countryId filtresi için (getInitialListings country filter)
-- Mevcut indeksler districtId ve sportId'yi kapsıyor ama countryId yok
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Listing_cityId_idx"
  ON "Listing"("cityId");
