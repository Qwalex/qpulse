import { computeProfitPercentage } from '@qpulse/shared';

function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function applyTradeMetrics(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  const positionSizeUsdt = toOptionalNumber(next.positionSizeUsdt);
  const realizedPnlUsdt = toOptionalNumber(next.realizedPnlUsdt);
  if (positionSizeUsdt !== undefined) {
    next.positionSizeUsdt = positionSizeUsdt;
  }
  if (realizedPnlUsdt !== undefined) {
    next.realizedPnlUsdt = realizedPnlUsdt;
  }

  const shouldCompute =
    realizedPnlUsdt != null ||
    positionSizeUsdt != null ||
    next.profitPercentage === undefined;

  if (shouldCompute) {
    const computed = computeProfitPercentage({
      realizedPnlUsdt: (next.realizedPnlUsdt as number | null | undefined) ?? null,
      positionSizeUsdt: (next.positionSizeUsdt as number | null | undefined) ?? null,
      capitalPercentage: (next.capitalPercentage as number | null | undefined) ?? null,
      leverage: (next.leverage as number | null | undefined) ?? null,
      marketType: (next.marketType as string | null | undefined) ?? null,
    });
    if (computed != null) {
      next.profitPercentage = computed;
    }
  }

  return next;
}
