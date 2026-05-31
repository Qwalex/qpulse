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

import { MarketType } from '@qpulse/shared';



const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;



function normalizeBaseUrl(url: string): string {

  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

}



const API_BASE = `${normalizeBaseUrl(API_URL)}/api/v1`;



async function request<T>(path: string, init?: RequestInit): Promise<T> {

  const response = await fetch(`${API_BASE}${path}`, {

    ...init,

    headers: {

      'Content-Type': 'application/json',

      ...init?.headers,

    },

  });



  if (!response.ok) {

    const text = await response.text().catch(() => '');

    throw new Error(text || `Request failed: ${response.status}`);

  }



  if (response.status === 204) {

    return undefined as T;

  }



  return response.json() as Promise<T>;

}



export function getApiUrl(): string {

  return normalizeBaseUrl(API_URL);

}



export function getRealtimeUrl(): string {

  if (WS_URL) {

    return normalizeBaseUrl(WS_URL);

  }

  return normalizeBaseUrl(API_URL);

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


