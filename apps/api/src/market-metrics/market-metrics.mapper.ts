import type { MarketMetricsDto } from '@qpulse/shared';

export function formatMarketCapUsd(usd: number): string {
  const abs = Math.abs(usd);
  if (abs >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function altcoinSeasonLabel(index: number): string {
  if (index <= 25) return 'Bitcoin Season';
  if (index >= 75) return 'Altcoin Season';
  return 'Mixed Market';
}

export function mapHomeContentToMetrics(content: {
  totalMarketCap: string;
  totalMarketCapChange24h: number;
  altcoinSeasonIndex: number;
  altcoinSeasonLabel: string;
  fearGreedValue: number;
  fearGreedLabel: string;
}): MarketMetricsDto {
  return {
    totalMarketCap: content.totalMarketCap,
    totalMarketCapChange24h: content.totalMarketCapChange24h,
    altcoinSeasonIndex: content.altcoinSeasonIndex,
    altcoinSeasonLabel: content.altcoinSeasonLabel,
    fearGreedValue: content.fearGreedValue,
    fearGreedLabel: content.fearGreedLabel,
  };
}
