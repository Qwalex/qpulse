-- CreateEnum
CREATE TYPE "PriceAlertCondition" AS ENUM ('ABOVE', 'BELOW', 'AT');
CREATE TYPE "PriceAlertSource" AS ENUM ('MANUAL', 'SIGNAL_ENTRY');

-- CreateTable
CREATE TABLE "WatchlistCoin" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "pairLabel" TEXT NOT NULL,
    "marketType" "MarketType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistCoin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "pairLabel" TEXT NOT NULL,
    "marketType" "MarketType" NOT NULL,
    "targetPrice" DECIMAL(65,30) NOT NULL,
    "condition" "PriceAlertCondition" NOT NULL,
    "source" "PriceAlertSource" NOT NULL DEFAULT 'MANUAL',
    "signalId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "lastPrice" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceAlertLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "alertId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistCoin_deviceId_symbol_marketType_key" ON "WatchlistCoin"("deviceId", "symbol", "marketType");
CREATE INDEX "WatchlistCoin_deviceId_sortOrder_idx" ON "WatchlistCoin"("deviceId", "sortOrder");
CREATE INDEX "PriceAlert_deviceId_isActive_idx" ON "PriceAlert"("deviceId", "isActive");
CREATE INDEX "PriceAlert_isActive_symbol_marketType_idx" ON "PriceAlert"("isActive", "symbol", "marketType");
CREATE INDEX "PriceAlertLog_createdAt_idx" ON "PriceAlertLog"("createdAt");
