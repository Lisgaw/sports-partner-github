-- Listing sorgu performans indeksleri
CREATE INDEX IF NOT EXISTS "Listing_status_isQuick_dateTime_idx"
  ON "Listing"("status", "isQuick" DESC, "dateTime" ASC);

CREATE INDEX IF NOT EXISTS "Listing_status_createdAt_idx"
  ON "Listing"("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Listing_cityId_idx"
  ON "Listing"("cityId");
