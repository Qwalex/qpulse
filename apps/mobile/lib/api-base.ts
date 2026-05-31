const PRODUCTION_API_HOST = 'https://qpulse-api-production.up.railway.app';

export function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:3001'
    : PRODUCTION_API_HOST;
}

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

export function getApiBasePath(): string {
  return `${normalizeBaseUrl(resolveApiUrl())}/api/v1`;
}

export function getRealtimeBaseUrl(): string {
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL;
  if (wsUrl) {
    return normalizeBaseUrl(wsUrl);
  }
  return normalizeBaseUrl(resolveApiUrl());
}
