-- AlterTable
ALTER TABLE "Signal" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Signal" ADD COLUMN "source" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Signal_externalId_key" ON "Signal"("externalId");
