-- CreateTable
CREATE TABLE "DeviceNotificationPreferences" (
    "deviceId" TEXT NOT NULL,
    "signalsNew" BOOLEAN NOT NULL DEFAULT true,
    "signalsTp" BOOLEAN NOT NULL DEFAULT true,
    "signalsSl" BOOLEAN NOT NULL DEFAULT true,
    "signalsLiquidation" BOOLEAN NOT NULL DEFAULT true,
    "signalsClosed" BOOLEAN NOT NULL DEFAULT true,
    "signalsUpdates" BOOLEAN NOT NULL DEFAULT true,
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "spotEnabled" BOOLEAN NOT NULL DEFAULT true,
    "futuresEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceNotificationPreferences_pkey" PRIMARY KEY ("deviceId")
);
