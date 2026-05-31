-- CreateEnum
CREATE TYPE "ClientErrorKind" AS ENUM ('RENDER', 'QUERY', 'MUTATION', 'NETWORK', 'JSON');

-- CreateTable
CREATE TABLE "ClientErrorReport" (
    "id" TEXT NOT NULL,
    "kind" "ClientErrorKind" NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "screen" TEXT,
    "apiPath" TEXT,
    "deviceId" TEXT,
    "platform" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientErrorReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientErrorReport_createdAt_idx" ON "ClientErrorReport"("createdAt");

-- CreateIndex
CREATE INDEX "ClientErrorReport_kind_createdAt_idx" ON "ClientErrorReport"("kind", "createdAt");
