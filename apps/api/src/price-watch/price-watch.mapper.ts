import { MarketType, PriceAlertCondition } from '@prisma/client';
import {
  bybitSymbolToPairLabel,
  pairToBybitSymbol,
  PriceAlertSource,
  type PriceAlertDto,
  type PriceTickerDto,
  type PriceWatchStateDto,
  type WatchlistCoinDto,
} from '@qpulse/shared';

export const PRICE_AT_TOLERANCE = 0.0005;

export function mapWatchlistCoin(row: {
  id: string;
  deviceId: string;
  symbol: string;
  pairLabel: string;
  marketType: MarketType;
  sortOrder: number;
  createdAt: Date;
}): WatchlistCoinDto {
  return {
    id: row.id,
    deviceId: row.deviceId,
    symbol: row.symbol,
    pairLabel: row.pairLabel,
    marketType: row.marketType as WatchlistCoinDto['marketType'],
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapPriceAlert(row: {
  id: string;
  deviceId: string;
  symbol: string;
  pairLabel: string;
  marketType: MarketType;
  targetPrice: { toNumber(): number } | number;
  condition: PriceAlertCondition;
  source: string;
  signalId: string | null;
  isActive: boolean;
  triggeredAt: Date | null;
  createdAt: Date;
}): PriceAlertDto {
  const targetPrice =
    typeof row.targetPrice === 'number' ? row.targetPrice : row.targetPrice.toNumber();
  return {
    id: row.id,
    deviceId: row.deviceId,
    symbol: row.symbol,
    pairLabel: row.pairLabel,
    marketType: row.marketType as PriceAlertDto['marketType'],
    targetPrice,
    condition: row.condition as PriceAlertDto['condition'],
    source: row.source as PriceAlertDto['source'],
    signalId: row.signalId,
    isActive: row.isActive,
    triggeredAt: row.triggeredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function normalizePairInput(pair: string): { symbol: string; pairLabel: string } {
  const symbol = pairToBybitSymbol(pair);
  if (!symbol) {
    throw new Error('Invalid pair');
  }
  return {
    symbol,
    pairLabel: pair.includes('/') ? pair.trim().toUpperCase() : bybitSymbolToPairLabel(symbol),
  };
}

export function marketTypeToBybitCategory(marketType: MarketType): 'spot' | 'linear' {
  return marketType === MarketType.SPOT ? 'spot' : 'linear';
}

export function buildTickerDto(
  symbol: string,
  marketType: MarketType,
  price: number,
  change24hPct: number | null,
  updatedAt: Date,
): PriceTickerDto {
  return {
    symbol,
    pairLabel: bybitSymbolToPairLabel(symbol),
    marketType: marketType as PriceTickerDto['marketType'],
    price,
    change24hPct,
    updatedAt: updatedAt.toISOString(),
  };
}

export function emptyPriceWatchState(): PriceWatchStateDto {
  return { watchlist: [], alerts: [], tickers: [] };
}

export function isPriceAtTarget(price: number, target: number): boolean {
  if (target <= 0) return false;
  return Math.abs(price - target) / target <= PRICE_AT_TOLERANCE;
}

export function shouldTriggerAlert(
  condition: PriceAlertCondition,
  price: number,
  target: number,
  lastPrice: number | null,
): boolean {
  switch (condition) {
    case PriceAlertCondition.AT:
      return isPriceAtTarget(price, target);
    case PriceAlertCondition.ABOVE:
      if (lastPrice == null) return false;
      return lastPrice < target && price >= target;
    case PriceAlertCondition.BELOW:
      if (lastPrice == null) return false;
      return lastPrice > target && price <= target;
    default:
      return false;
  }
}

export function formatAlertTargetPrice(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
  return value.toPrecision(4);
}

export { PriceAlertSource };
