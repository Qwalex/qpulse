import type {
  AppSettingsDto,
  DeviceRegisterDto,
  HomeContentDto,
  MenuLinkDto,
  ResultsResponse,
  ReviewCreateDto,
  ReviewDto,
  ReviewMineResponse,
  SignalDto,
} from '@qpulse/shared';
import { ClientErrorKind, MarketType } from '@qpulse/shared';
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

export { MarketType };
