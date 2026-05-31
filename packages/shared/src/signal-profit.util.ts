export function computeProfitPercentage(params: {
  realizedPnlUsdt?: number | null;
  positionSizeUsdt?: number | null;
  capitalPercentage?: number | null;
  leverage?: number | null;
  marketType?: 'SPOT' | 'FUTURES' | string | null;
}): number | null {
  const pnl = params.realizedPnlUsdt;
  if (pnl == null || !Number.isFinite(pnl)) return null;

  const positionSize = params.positionSizeUsdt;
  const capital = params.capitalPercentage ?? 1;
  const notional =
    positionSize != null && positionSize > 0 ? positionSize : Math.max(1, capital);
  if (notional <= 0) return null;

  const isSpot = String(params.marketType ?? '').toUpperCase() === 'SPOT';
  const leverage = isSpot ? 1 : Math.max(1, params.leverage ?? 1);
  return (pnl / notional) * 100 * leverage;
}
