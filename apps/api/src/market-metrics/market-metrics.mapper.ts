import type { MarketCapChartPoint, MarketMetricsDto } from '@qpulse/shared';

const CHART_MAX_POINTS = 48;

export function downsampleMarketCapChart(
  points: MarketCapChartPoint[],
  maxPoints = CHART_MAX_POINTS,
): MarketCapChartPoint[] {
  if (points.length <= maxPoints) return points;
  const result: MarketCapChartPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * (points.length - 1));
    result.push(points[idx]);
  }
  return result;
}

export function scaleBtcMarketCapChart(
  btcMarketCaps: Array<[number, number]>,
  totalMarketCapUsd: number,
): MarketCapChartPoint[] {
  if (btcMarketCaps.length === 0) return [];
  const latestBtc = btcMarketCaps[btcMarketCaps.length - 1][1];
  if (!Number.isFinite(latestBtc) || latestBtc <= 0) return [];
  const scale = totalMarketCapUsd / latestBtc;
  return btcMarketCaps.map(([timestamp, valueUsd]) => ({
    timestamp,
    valueUsd: valueUsd * scale,
  }));
}

export function formatUsdCompact(usd: number): string {
  const abs = Math.abs(usd);
  if (abs >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatMarketCapUsd(usd: number): string {
  return formatUsdCompact(usd);
}

export function formatBtcPrice(usd: number): string {
  if (usd >= 1000) {
    return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function compute90dChangeFromPrices(prices: Array<[number, number]>): number {
  if (prices.length < 2) {
    throw new Error('Insufficient price history for 90d change');
  }
  const first = prices[0][1];
  const last = prices[prices.length - 1][1];
  if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) {
    throw new Error('Invalid price history for 90d change');
  }
  return ((last - first) / first) * 100;
}

export function altcoinSeasonLabel(index: number): string {
  if (index <= 25) return 'Bitcoin Season';
  if (index >= 75) return 'Altcoin Season';
  return 'Mixed Market';
}

export interface AltcoinMarketRow {
  id: string;
  price_change_percentage_30d?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
}

export function coin30dChange(row: AltcoinMarketRow): number | null {
  const change = row.price_change_percentage_30d_in_currency ?? row.price_change_percentage_30d;
  return change == null ? null : change;
}

export function computeAltcoinSeasonFrom30dMarkets(
  markets: AltcoinMarketRow[],
  excludedIds: ReadonlySet<string>,
  topN = 50,
): { index: number; sampleSize: number } {
  const btc = markets.find((row) => row.id === 'bitcoin');
  const btcChange = coin30dChange(btc ?? { id: 'bitcoin' }) ?? 0;

  const alts = markets
    .filter(
      (row) =>
        row.id !== 'bitcoin' && !excludedIds.has(row.id) && coin30dChange(row) != null,
    )
    .slice(0, topN);

  if (alts.length === 0) {
    throw new Error('No altcoins with 30d performance data');
  }

  const outperforming = alts.filter(
    (row) => (coin30dChange(row) ?? -Infinity) > btcChange,
  ).length;

  return {
    index: Math.max(0, Math.min(100, Math.round((outperforming / alts.length) * 100))),
    sampleSize: alts.length,
  };
}

export function mapHomeContentToMetrics(content: {
  totalMarketCap: string;
  totalMarketCapChange24h: number;
  altcoinSeasonIndex: number;
  altcoinSeasonLabel: string;
  fearGreedValue: number;
  fearGreedLabel: string;
  btcPrice?: number;
  btcChange24h?: number;
  btcVolume?: string;
}): MarketMetricsDto {
  const metrics: MarketMetricsDto = {
    totalMarketCap: content.totalMarketCap,
    totalMarketCapChange24h: content.totalMarketCapChange24h,
    altcoinSeasonIndex: content.altcoinSeasonIndex,
    altcoinSeasonLabel: content.altcoinSeasonLabel,
    fearGreedValue: content.fearGreedValue,
    fearGreedLabel: content.fearGreedLabel,
  };
  if (content.btcPrice != null && content.btcPrice > 0) {
    metrics.btcPrice = formatBtcPrice(content.btcPrice);
    metrics.btcChange24h = content.btcChange24h ?? 0;
  }
  if (content.btcVolume) {
    metrics.totalVolume24h = content.btcVolume;
  }
  return metrics;
}
