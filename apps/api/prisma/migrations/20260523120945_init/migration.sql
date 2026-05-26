-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('SPOT', 'FUTURES');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('OPEN', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResultsTimeframe" AS ENUM ('ONE_W', 'ONE_M', 'THREE_M', 'SIX_M', 'ONE_Y');

-- CreateEnum
CREATE TYPE "SignalEventType" AS ENUM ('SIGNAL_CREATED', 'SIGNAL_UPDATED', 'TP_HIT', 'SL_HIT', 'LIQUIDATED', 'SIGNAL_CLOSED', 'SIGNAL_CANCELLED');

-- CreateEnum
CREATE TYPE "MenuActionType" AS ENUM ('EXTERNAL_LINK', 'INTERNAL_ROUTE');

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "marketType" "MarketType" NOT NULL,
    "direction" "Direction",
    "action" TEXT,
    "entryPrice" DECIMAL(65,30) NOT NULL,
    "capitalPercentage" DOUBLE PRECISION NOT NULL,
    "leverage" INTEGER,
    "openDate" TIMESTAMP(3) NOT NULL,
    "closeDate" TIMESTAMP(3),
    "status" "SignalStatus" NOT NULL,
    "currentTpLevel" INTEGER,
    "slHit" BOOLEAN NOT NULL DEFAULT false,
    "liquidated" BOOLEAN NOT NULL DEFAULT false,
    "targetHitLabel" TEXT,
    "profitPercentage" DOUBLE PRECISION,
    "logoUrl" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultsSummary" (
    "marketType" "MarketType" NOT NULL,
    "timeframe" "ResultsTimeframe" NOT NULL,
    "totalTrades" INTEGER NOT NULL,
    "winTrades" INTEGER NOT NULL,
    "lossTrades" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "totalProfit" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultsSummary_pkey" PRIMARY KEY ("marketType","timeframe")
);

-- CreateTable
CREATE TABLE "SignalEventLog" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "eventType" "SignalEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "eventType" "SignalEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "eventType" "SignalEventType" NOT NULL,
    "titleTpl" TEXT NOT NULL,
    "bodyTpl" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "deepLink" TEXT NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("eventType")
);

-- CreateTable
CREATE TABLE "HomeContent" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "btcPrice" DECIMAL(65,30) NOT NULL,
    "btcChange24h" DOUBLE PRECISION NOT NULL,
    "btcMarketCap" TEXT NOT NULL,
    "btcVolume" TEXT NOT NULL,
    "fearGreedValue" INTEGER NOT NULL,
    "fearGreedLabel" TEXT NOT NULL,
    "ticker" JSONB NOT NULL,
    "socialLinks" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "actionType" "MenuActionType" NOT NULL,
    "url" TEXT,
    "route" TEXT,
    "order" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "disclaimer" TEXT NOT NULL,
    "telegramFabUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_pushToken_key" ON "DeviceToken"("pushToken");

-- CreateIndex
CREATE INDEX "Review_deviceId_createdAt_idx" ON "Review"("deviceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "SignalEventLog" ADD CONSTRAINT "SignalEventLog_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
