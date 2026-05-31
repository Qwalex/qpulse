-- DropIndex
DROP INDEX "Review_deviceId_createdAt_idx";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Review_deviceId_key" ON "Review"("deviceId");
