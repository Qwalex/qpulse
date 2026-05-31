-- Replace BTC/ticker fields with market metrics for dashboard redesign

ALTER TABLE "HomeContent" ADD COLUMN "totalMarketCap" TEXT;
ALTER TABLE "HomeContent" ADD COLUMN "totalMarketCapChange24h" DOUBLE PRECISION;
ALTER TABLE "HomeContent" ADD COLUMN "altcoinSeasonIndex" INTEGER;
ALTER TABLE "HomeContent" ADD COLUMN "altcoinSeasonLabel" TEXT;

UPDATE "HomeContent"
SET
  "totalMarketCap" = COALESCE("btcMarketCap", '$2.84T'),
  "totalMarketCapChange24h" = COALESCE("btcChange24h", 1.8),
  "altcoinSeasonIndex" = 38,
  "altcoinSeasonLabel" = 'Bitcoin Season'
WHERE "totalMarketCap" IS NULL;

ALTER TABLE "HomeContent" ALTER COLUMN "totalMarketCap" SET NOT NULL;
ALTER TABLE "HomeContent" ALTER COLUMN "totalMarketCapChange24h" SET NOT NULL;
ALTER TABLE "HomeContent" ALTER COLUMN "altcoinSeasonIndex" SET NOT NULL;
ALTER TABLE "HomeContent" ALTER COLUMN "altcoinSeasonLabel" SET NOT NULL;

ALTER TABLE "HomeContent" DROP COLUMN "btcPrice";
ALTER TABLE "HomeContent" DROP COLUMN "btcChange24h";
ALTER TABLE "HomeContent" DROP COLUMN "btcMarketCap";
ALTER TABLE "HomeContent" DROP COLUMN "btcVolume";
ALTER TABLE "HomeContent" DROP COLUMN "ticker";
