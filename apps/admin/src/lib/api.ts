const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/** Same-origin proxy on admin — refresh cookie is first-party in the browser. */
const AUTH_API_BASE = typeof window !== 'undefined' ? '/api/v1' : API_BASE;

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : res.statusText || 'Request failed';
    throw new ApiError(message, res.status, data);
  }

  return data;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/admin/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await parseResponse<{ accessToken: string }>(res);
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, skipRefresh, headers: initHeaders, ...rest } = options;

  const headers = new Headers(initHeaders);
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (rest.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && !skipAuth && !skipRefresh && path !== '/admin/auth/refresh') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_BASE}${path}`, {
        ...rest,
        credentials: 'include',
        headers,
      });
    }
  }

  return parseResponse<T>(res);
}

type AuthFetchOptions = RequestInit & { withAccessToken?: boolean };

async function authFetch<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  const { withAccessToken, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (withAccessToken && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (rest.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${AUTH_API_BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers,
  });
  return parseResponse<T>(res);
}

export const api = {
  login: (email: string, password: string) =>
    authFetch<{ accessToken: string; user: { id: string; email: string } }>(
      '/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    ),

  logout: () =>
    authFetch<{ ok: boolean }>('/admin/auth/logout', {
      method: 'POST',
      withAccessToken: true,
    }),

  me: () =>
    authFetch<{ id: string; email: string }>('/admin/auth/me', { withAccessToken: true }),

  refresh: () =>
    authFetch<{ accessToken: string; user: { id: string; email: string } }>(
      '/admin/auth/refresh',
      { method: 'POST' },
    ),

  dashboard: () =>
    apiFetch<{
      live: number;
      closed: number;
      cancelled: number;
      pendingReviews: number;
      recentPushEvents: Array<{
        id: string;
        eventType: string;
        title: string;
        body: string;
        status: string;
        createdAt: string;
      }>;
    }>('/admin/dashboard'),

  signals: {
    list: (params?: { status?: string; marketType?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.marketType) q.set('marketType', params.marketType);
      const qs = q.toString();
      return apiFetch<import('@qpulse/shared').SignalDto[]>(
        `/admin/signals${qs ? `?${qs}` : ''}`,
      );
    },
    get: (id: string) =>
      apiFetch<import('@qpulse/shared').SignalDto>(`/admin/signals/${id}`),
    create: (body: Record<string, unknown>) =>
      apiFetch<import('@qpulse/shared').SignalDto>('/admin/signals', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Record<string, unknown>) =>
      apiFetch<import('@qpulse/shared').SignalDto>(`/admin/signals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      apiFetch<{ ok: boolean }>(`/admin/signals/${id}`, { method: 'DELETE' }),
  },

  resultsSummary: {
    list: () => apiFetch<ResultsSummaryRow[]>('/admin/results-summary'),
    upsert: (body: Record<string, unknown>) =>
      apiFetch<ResultsSummaryRow>('/admin/results-summary', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (marketType: string, timeframe: string, body: Record<string, unknown>) =>
      apiFetch<ResultsSummaryRow>(
        `/admin/results-summary/${marketType}/${timeframe}`,
        { method: 'PATCH', body: JSON.stringify(body) },
      ),
    delete: (marketType: string, timeframe: string) =>
      apiFetch<ResultsSummaryRow>(
        `/admin/results-summary/${marketType}/${timeframe}`,
        { method: 'DELETE' },
      ),
  },

  menuLinks: {
    list: () => apiFetch<import('@qpulse/shared').MenuLinkDto[]>('/admin/menu-links'),
    create: (body: Record<string, unknown>) =>
      apiFetch<import('@qpulse/shared').MenuLinkDto>('/admin/menu-links', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Record<string, unknown>) =>
      apiFetch<import('@qpulse/shared').MenuLinkDto>(`/admin/menu-links/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      apiFetch<import('@qpulse/shared').MenuLinkDto>(`/admin/menu-links/${id}`, {
        method: 'DELETE',
      }),
  },

  reviews: {
    list: () => apiFetch<ReviewRow[]>('/admin/reviews'),
    delete: (id: string) =>
      apiFetch<ReviewRow>(`/admin/reviews/${id}`, { method: 'DELETE' }),
  },

  homeContent: {
    get: () => apiFetch<import('@qpulse/shared').HomeContentDto>('/admin/home-content'),
    update: (body: Record<string, unknown>) =>
      apiFetch<import('@qpulse/shared').HomeContentDto>('/admin/home-content', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  settings: {
    get: () => apiFetch<import('@qpulse/shared').AppSettingsDto>('/admin/settings'),
    update: (body: Record<string, unknown>) =>
      apiFetch<import('@qpulse/shared').AppSettingsDto>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  notifications: {
    templates: () => apiFetch<NotificationTemplateRow[]>('/admin/notification-templates'),
    updateTemplate: (eventType: string, body: Record<string, unknown>) =>
      apiFetch<NotificationTemplateRow>(`/admin/notification-templates/${eventType}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...body, eventType }),
      }),
    log: () => apiFetch<NotificationLogRow[]>('/admin/notifications/log'),
  },
};

export interface ResultsSummaryRow {
  marketType: string;
  timeframe: string;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  totalProfit: number;
  updatedAt: string;
}

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  deviceId: string | null;
  createdAt: string;
}

export interface NotificationTemplateRow {
  eventType: string;
  titleTpl: string;
  bodyTpl: string;
  channel: string;
  priority: string;
  deepLink: string;
}

export interface NotificationLogRow {
  id: string;
  deviceId: string | null;
  eventType: string;
  title: string;
  body: string;
  status: string;
  error: string | null;
  createdAt: string;
}
