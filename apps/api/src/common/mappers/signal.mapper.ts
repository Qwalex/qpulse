import { Signal, Prisma } from '@prisma/client';
import { SignalDto } from '@qpulse/shared';

export function mapSignal(signal: Signal): SignalDto {
  return {
    id: signal.id,
    externalId: signal.externalId,
    source: signal.source,
    pair: signal.pair,
    marketType: signal.marketType as SignalDto['marketType'],
    direction: signal.direction as SignalDto['direction'],
    action: signal.action,
    entryPrice: Number(signal.entryPrice),
    capitalPercentage: signal.capitalPercentage,
    leverage: signal.leverage,
    openDate: signal.openDate.toISOString(),
    closeDate: signal.closeDate?.toISOString() ?? null,
    status: signal.status as SignalDto['status'],
    currentTpLevel: signal.currentTpLevel,
    slHit: signal.slHit,
    liquidated: signal.liquidated,
    targetHitLabel: signal.targetHitLabel,
    profitPercentage: signal.profitPercentage,
    positionSizeUsdt: signal.positionSizeUsdt,
    realizedPnlUsdt: signal.realizedPnlUsdt,
    logoUrl: signal.logoUrl,
    details: signal.details as SignalDto['details'],
    createdAt: signal.createdAt.toISOString(),
    updatedAt: signal.updatedAt.toISOString(),
  };
}

export function normalizeSignalInput(data: Record<string, unknown>): Prisma.SignalUpdateInput {
  const result: Prisma.SignalUpdateInput = { ...data } as Prisma.SignalUpdateInput;
  if (data.entryPrice !== undefined) {
    result.entryPrice = new Prisma.Decimal(data.entryPrice as number);
  }
  if (data.openDate !== undefined) {
    result.openDate = new Date(data.openDate as string);
  }
  if (data.closeDate !== undefined) {
    result.closeDate = data.closeDate ? new Date(data.closeDate as string) : null;
  }
  if (data.liquidated === true) {
    result.slHit = false;
  }
  return result;
}
