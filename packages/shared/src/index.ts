export { MarketType } from './market-type';
import type { MarketType } from './market-type';

export enum Direction {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum SignalStatus {
  OPEN = 'OPEN',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum ResultsTimeframe {
  ONE_W = 'ONE_W',
  ONE_M = 'ONE_M',
  THREE_M = 'THREE_M',
  SIX_M = 'SIX_M',
  ONE_Y = 'ONE_Y',
}

export enum SignalEventType {
  SIGNAL_CREATED = 'SIGNAL_CREATED',
  SIGNAL_UPDATED = 'SIGNAL_UPDATED',
  TP_HIT = 'TP_HIT',
  SL_HIT = 'SL_HIT',
  LIQUIDATED = 'LIQUIDATED',
  SIGNAL_CLOSED = 'SIGNAL_CLOSED',
  SIGNAL_CANCELLED = 'SIGNAL_CANCELLED',
}

export enum MenuActionType {
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  INTERNAL_ROUTE = 'INTERNAL_ROUTE',
}

export const TIMEFRAME_API_MAP: Record<string, ResultsTimeframe> = {
  '1W': ResultsTimeframe.ONE_W,
  '1M': ResultsTimeframe.ONE_M,
  '3M': ResultsTimeframe.THREE_M,
  '6M': ResultsTimeframe.SIX_M,
  '1Y': ResultsTimeframe.ONE_Y,
};

export const TIMEFRAME_DAYS: Record<ResultsTimeframe, number> = {
  [ResultsTimeframe.ONE_W]: 7,
  [ResultsTimeframe.ONE_M]: 30,
  [ResultsTimeframe.THREE_M]: 90,
  [ResultsTimeframe.SIX_M]: 180,
  [ResultsTimeframe.ONE_Y]: 365,
};

export interface SignalTarget {
  label: string;
  price: number;
  profitPercent: number;
  /** Whether this take-profit level was reached. */
  hit?: boolean;
}

export interface SignalDetails {
  targets: SignalTarget[];
  stopLoss?: number;
}

export interface SignalDto {
  id: string;
  externalId?: string | null;
  source?: string | null;
  pair: string;
  marketType: MarketType;
  direction?: Direction | null;
  action?: string | null;
  entryPrice: number;
  capitalPercentage: number;
  leverage?: number | null;
  openDate: string;
  closeDate?: string | null;
  status: SignalStatus;
  currentTpLevel?: number | null;
  slHit: boolean;
  liquidated: boolean;
  targetHitLabel?: string | null;
  profitPercentage?: number | null;
  positionSizeUsdt?: number | null;
  realizedPnlUsdt?: number | null;
  logoUrl?: string | null;
  details?: SignalDetails | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResultsSummaryDto {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  totalProfit: number;
}

export interface ResultsResponse {
  summary: ResultsSummaryDto;
  signals: SignalDto[];
}

export interface MarketCapChartPoint {
  timestamp: number;
  valueUsd: number;
}

export interface MarketMetricsDto {
  totalMarketCap: string;
  totalMarketCapChange24h: number;
  /** Global crypto 24h trading volume (formatted). */
  totalVolume24h?: string;
  btcPrice?: string;
  btcChange24h?: number;
  altcoinSeasonIndex: number;
  altcoinSeasonLabel: string;
  fearGreedValue: number;
  fearGreedLabel: string;
  /** 24h total market cap series (scaled from CoinGecko BTC market cap shape). */
  marketCapChart24h?: MarketCapChartPoint[];
}

export interface HomeContentDto {
  totalMarketCap: string;
  totalMarketCapChange24h: number;
  altcoinSeasonIndex: number;
  altcoinSeasonLabel: string;
  fearGreedValue: number;
  fearGreedLabel: string;
  socialLinks: Array<{ id: string; label: string; url: string; icon: string }>;
  /** @deprecated Legacy mobile builds — mapped from market metrics for backward compatibility. */
  btcPrice?: number;
  btcChange24h?: number;
  btcMarketCap?: string;
  btcVolume?: string;
  ticker?: Array<{ pair: string; price: number; change: number }>;
}

export interface AppSettingsDto {
  disclaimer: string;
  telegramFabUrl?: string | null;
}

export interface MenuLinkDto {
  id: string;
  label: string;
  icon: string;
  actionType: MenuActionType;
  url?: string | null;
  route?: string | null;
  order: number;
  isEnabled: boolean;
}

export interface ReviewCreateDto {
  rating: number;
  comment?: string;
  deviceId?: string;
}

export interface ReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewMineResponse {
  review: ReviewDto | null;
}

export interface DeviceRegisterDto {
  pushToken: string;
  platform: string;
  deviceId?: string;
}

export interface WsSubscribeMessage {
  type: 'subscribe';
  channels: string[];
}

export interface WsSignalCreated {
  type: 'signal:created';
  payload: SignalDto;
}

export interface WsSignalUpdated {
  type: 'signal:updated';
  payload: SignalDto;
}

export interface WsSignalDeleted {
  type: 'signal:deleted';
  payload: { signalId: string };
}

export interface WsSignalEvent {
  type: 'signal:event';
  payload: {
    eventType: SignalEventType;
    signalId: string;
    tpLevel?: number;
    [key: string]: unknown;
  };
}

export type WsServerMessage =
  | WsSignalCreated
  | WsSignalUpdated
  | WsSignalDeleted
  | WsSignalEvent;

export interface PushJobPayload {
  eventType: SignalEventType;
  signalId: string;
  payload: Record<string, unknown>;
}

export interface AdminUserDto {
  id: string;
  email: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  user: AdminUserDto;
}

export {
  normalizeSignalTarget,
  normalizeSignalDetails,
  deriveExecutionFields,
  countTargetHits,
  hasNewTargetHit,
} from './signal-details';
export type { SignalDetailsShape, SignalTargetShape } from './signal-details';
export { ClientErrorKind } from './client-errors.types';
export type { ClientErrorCreateDto, ClientErrorReportDto } from './client-errors.types';
export { computeProfitPercentage } from './signal-profit.util';
export { computeResultsSummary } from './results-summary.util';
export type { ResultsSummarySignalInput } from './results-summary.util';
export {
  DASHBOARD_RESULTS_PERIOD_DAYS,
  emulateProfitUsd,
  resolveEmulationTotalProfitPercent,
} from './profit-emulation.util';
export type {
  ProfitEmulationPeriod,
  ProfitEmulationProjection,
  ResultsSummaryProfitInput,
} from './profit-emulation.util';
export {
  PriceAlertCondition,
  PriceAlertSource,
  WATCHLIST_MAX,
  PRICE_DEVICE_CHANNEL_PREFIX,
  priceDeviceChannel,
} from './price-watch.types';
export type {
  WatchlistCoinDto,
  PriceAlertDto,
  PriceTickerDto,
  PriceWatchStateDto,
  AddWatchlistCoinDto,
  CreatePriceAlertDto,
  CreateEntryAlertFromSignalDto,
} from './price-watch.types';
export { pairToBybitSymbol, bybitSymbolToPairLabel } from './pair-symbol.util';
export type {
  DeviceNotificationPreferencesDto,
  DeviceNotificationPreferencesUpdateDto,
  DeviceNotificationPreferenceKey,
} from './notification-preferences.types';
export {
  DEFAULT_DEVICE_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  shouldDeliverSignalPush,
  shouldDeliverPriceAlertPush,
} from './notification-preferences.util';
