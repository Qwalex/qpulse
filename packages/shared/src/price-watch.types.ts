import type { MarketType } from './market-type';

export enum PriceAlertCondition {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
  AT = 'AT',
}

export enum PriceAlertSource {
  MANUAL = 'MANUAL',
  SIGNAL_ENTRY = 'SIGNAL_ENTRY',
}

export const WATCHLIST_MAX = 10;
export const PRICE_DEVICE_CHANNEL_PREFIX = 'prices:device:';

export function priceDeviceChannel(deviceId: string): string {
  return `${PRICE_DEVICE_CHANNEL_PREFIX}${deviceId}`;
}

export interface WatchlistCoinDto {
  id: string;
  deviceId: string;
  symbol: string;
  pairLabel: string;
  marketType: MarketType;
  sortOrder: number;
  createdAt: string;
}

export interface PriceAlertDto {
  id: string;
  deviceId: string;
  symbol: string;
  pairLabel: string;
  marketType: MarketType;
  targetPrice: number;
  condition: PriceAlertCondition;
  source: PriceAlertSource;
  signalId?: string | null;
  isActive: boolean;
  triggeredAt?: string | null;
  createdAt: string;
}

export interface PriceTickerDto {
  symbol: string;
  pairLabel: string;
  marketType: MarketType;
  price: number;
  change24hPct?: number | null;
  updatedAt: string;
}

export interface PriceWatchStateDto {
  watchlist: WatchlistCoinDto[];
  alerts: PriceAlertDto[];
  tickers: PriceTickerDto[];
}

export interface AddWatchlistCoinDto {
  deviceId: string;
  pair: string;
  marketType: MarketType;
}

export interface CreatePriceAlertDto {
  deviceId: string;
  pair: string;
  marketType: MarketType;
  targetPrice: number;
  condition: PriceAlertCondition;
}

export interface CreateEntryAlertFromSignalDto {
  deviceId: string;
  signalId: string;
}
