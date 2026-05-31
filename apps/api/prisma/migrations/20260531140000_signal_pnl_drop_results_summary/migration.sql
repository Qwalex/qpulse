-- AlterTable
ALTER TABLE "Signal" ADD COLUMN "positionSizeUsdt" DOUBLE PRECISION;
ALTER TABLE "Signal" ADD COLUMN "realizedPnlUsdt" DOUBLE PRECISION;

-- DropTable
DROP TABLE "ResultsSummary";
