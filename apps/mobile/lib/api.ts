import type {
  AppSettingsDto,
  DeviceNotificationPreferencesDto,
  DeviceNotificationPreferencesUpdateDto,
  DeviceRegisterDto,
  HomeContentDto,
  MarketMetricsDto,
  MenuLinkDto,
  PriceAlertDto,
  PriceWatchStateDto,
  ResultsResponse,
  ReviewCreateDto,
  ReviewDto,
  ReviewMineResponse,
  SignalDto,
  WatchlistCoinDto,
} from '@qpulse/shared';
import { ClientErrorKind, MarketType, PriceAlertCondition } from '@qpulse/shared';
import { getApiBasePath as buildApiBasePath, getRealtimeBaseUrl, normalizeBaseUrl, resolveApiUrl } from '@/lib/api-base';
import { reportRequestError } from '@/lib/client-error-report';

const API_BASE = buildApiBasePath();

function parseErrorMessage(path: string, status: number, text: string): string {
  if (!text.trim()) {
    return `${path}: HTTP ${status}`;
  }
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (typeof json.message === 'string') {
      return `${path}: ${json.message}`;
    }
    if (Array.isArray(json.message)) {
      return `${path}: ${json.message.join(', ')}`;
    }
  } catch {
    // keep raw body
  }
  return `${path}: ${text.slice(0, 200)}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const message = `Network error (${API_BASE}${path}): ${detail}. Check internet and EXPO_PUBLIC_API_URL.`;
    reportRequestError(ClientErrorKind.NETWORK, message, path);
    throw new Error(message);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const message = parseErrorMessage(path, response.status, text);
    reportRequestError(ClientErrorKind.NETWORK, message, path);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body.trim()) {
    const message = `${path}: empty response body`;
    reportRequestError(ClientErrorKind.JSON, message, path);
    throw new Error(message);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    const message = `${path}: invalid JSON response`;
    reportRequestError(ClientErrorKind.JSON, message, path);
    throw new Error(message);
  }
}

export function getApiUrl(): string {
  return normalizeBaseUrl(resolveApiUrl());
}

export function getApiBasePath(): string {
  return API_BASE;
}

export function getRealtimeUrl(): string {
  return getRealtimeBaseUrl();
}

function toApiMarketType(marketType: MarketType): string {
  return marketType === MarketType.SPOT ? 'spot' : 'futures';
}

export function fetchSignals(marketType: MarketType, status = 'live'): Promise<SignalDto[]> {
  const params = new URLSearchParams({
    marketType: toApiMarketType(marketType),
    status,
  });
  return request<SignalDto[]>(`/signals?${params.toString()}`);
}

export function fetchSignal(id: string): Promise<SignalDto> {
  return request<SignalDto>(`/signals/${id}`);
}

export function fetchResults(
  marketType: MarketType,
  timeframe?: string,
): Promise<ResultsResponse> {
  const params = new URLSearchParams({ marketType: toApiMarketType(marketType) });
  if (timeframe) params.set('timeframe', timeframe);
  return request<ResultsResponse>(`/results?${params.toString()}`);
}

export function fetchHomeContent(): Promise<HomeContentDto> {
  return request<HomeContentDto>('/home-content');
}

export function fetchMarketMetrics(): Promise<MarketMetricsDto> {
  return request<MarketMetricsDto>('/market-metrics');
}

/** Fallback when /market-metrics is unavailable (e.g. API not deployed yet). */
export function homeContentToMarketMetrics(home: HomeContentDto): MarketMetricsDto {
  const metrics: MarketMetricsDto = {
    totalMarketCap: home.totalMarketCap,
    totalMarketCapChange24h: home.totalMarketCapChange24h,
    altcoinSeasonIndex: home.altcoinSeasonIndex,
    altcoinSeasonLabel: home.altcoinSeasonLabel,
    fearGreedValue: home.fearGreedValue,
    fearGreedLabel: home.fearGreedLabel,
  };
  if (home.btcPrice != null && home.btcPrice > 0) {
    metrics.btcPrice = `$${home.btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    metrics.btcChange24h = home.btcChange24h ?? home.totalMarketCapChange24h;
  }
  if (home.btcVolume) {
    metrics.totalVolume24h = home.btcVolume;
  }
  return metrics;
}

export function fetchSettings(): Promise<AppSettingsDto> {
  return request<AppSettingsDto>('/settings');
}

export function fetchMenuLinks(): Promise<MenuLinkDto[]> {
  return request<MenuLinkDto[]>('/settings/menu');
}

export function fetchMyReview(deviceId: string): Promise<ReviewMineResponse> {
  const q = new URLSearchParams({ deviceId });
  return request<ReviewMineResponse>(`/reviews/mine?${q.toString()}`);
}

export function submitReview(data: ReviewCreateDto): Promise<ReviewDto> {
  return request<ReviewDto>('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function registerDevice(data: DeviceRegisterDto): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/devices/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function unregisterDevice(pushToken: string): Promise<void> {
  return request<void>('/devices/unregister', {
    method: 'DELETE',
    body: JSON.stringify({ pushToken }),
  });
}

export function fetchNotificationPreferences(deviceId: string): Promise<DeviceNotificationPreferencesDto> {
  const q = new URLSearchParams({ deviceId });
  return request<DeviceNotificationPreferencesDto>(`/devices/notification-preferences?${q.toString()}`);
}

export function updateNotificationPreferences(
  deviceId: string,
  updates: Omit<DeviceNotificationPreferencesUpdateDto, 'deviceId'>,
): Promise<DeviceNotificationPreferencesDto> {
  return request<DeviceNotificationPreferencesDto>('/devices/notification-preferences', {
    method: 'PATCH',
    body: JSON.stringify({ deviceId, ...updates }),
  });
}

export function fetchPriceWatchState(deviceId: string): Promise<PriceWatchStateDto> {
  const q = new URLSearchParams({ deviceId });
  return request<PriceWatchStateDto>(`/price-watch?${q.toString()}`);
}

export function addWatchlistCoin(
  deviceId: string,
  pair: string,
  marketType: MarketType,
): Promise<WatchlistCoinDto> {
  return request<WatchlistCoinDto>('/price-watch/watchlist', {
    method: 'POST',
    body: JSON.stringify({ deviceId, pair, marketType }),
  });
}

export function removeWatchlistCoin(id: string, deviceId: string): Promise<{ ok: boolean }> {
  const q = new URLSearchParams({ deviceId });
  return request<{ ok: boolean }>(`/price-watch/watchlist/${id}?${q.toString()}`, {
    method: 'DELETE',
  });
}

export function createPriceAlert(
  deviceId: string,
  pair: string,
  marketType: MarketType,
  targetPrice: number,
  condition: PriceAlertCondition,
): Promise<PriceAlertDto> {
  return request<PriceAlertDto>('/price-watch/alerts', {
    method: 'POST',
    body: JSON.stringify({ deviceId, pair, marketType, targetPrice, condition }),
  });
}

export function createEntryAlertFromSignal(
  deviceId: string,
  signalId: string,
): Promise<PriceAlertDto> {
  return request<PriceAlertDto>('/price-watch/alerts/from-signal', {
    method: 'POST',
    body: JSON.stringify({ deviceId, signalId }),
  });
}

export function deletePriceAlert(id: string, deviceId: string): Promise<{ ok: boolean }> {
  const q = new URLSearchParams({ deviceId });
  return request<{ ok: boolean }>(`/price-watch/alerts/${id}?${q.toString()}`, {
    method: 'DELETE',
  });
}

export { MarketType, PriceAlertCondition };
