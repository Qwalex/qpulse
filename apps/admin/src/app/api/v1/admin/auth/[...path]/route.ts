import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api/v1';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_PATH = '/api/v1/admin/auth';

function upstreamUrl(segments: string[]): string {
  return `${UPSTREAM_BASE.replace(/\/$/, '')}/admin/auth/${segments.join('/')}`;
}

function extractRefreshValue(setCookieHeaders: string[]): string | null {
  for (const raw of setCookieHeaders) {
    if (!raw.startsWith(`${REFRESH_COOKIE}=`)) continue;
    const value = raw.split(';')[0].slice(`${REFRESH_COOKIE}=`.length);
    if (value) return value;
  }
  return null;
}

function isRefreshCleared(setCookieHeaders: string[]): boolean {
  return setCookieHeaders.some(
    (raw) =>
      raw.startsWith(`${REFRESH_COOKIE}=`) &&
      (/Max-Age=0/i.test(raw) || /Expires=Thu, 01 Jan 1970/i.test(raw)),
  );
}

function setRefreshCookie(res: NextResponse, value: string) {
  res.cookies.set(REFRESH_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_PATH,
    maxAge: 7 * 24 * 60 * 60,
  });
}

function clearRefreshCookie(res: NextResponse) {
  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_PATH,
    maxAge: 0,
  });
}

async function proxy(req: NextRequest, segments: string[]) {
  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const incoming = req.cookies.get(REFRESH_COOKIE)?.value;
  if (incoming) {
    headers.set('Cookie', `${REFRESH_COOKIE}=${incoming}`);
  }

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.text();
    if (body) init.body = body;
  }

  const upstream = await fetch(upstreamUrl(segments), init);
  const text = await upstream.text();
  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : upstream.headers.get('set-cookie')
        ? [upstream.headers.get('set-cookie')!]
        : [];

  const res = new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
    },
  });

  if (isRefreshCleared(setCookies)) {
    clearRefreshCookie(res);
  } else {
    const refreshValue = extractRefreshValue(setCookies);
    if (refreshValue) setRefreshCookie(res, refreshValue);
  }

  return res;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
