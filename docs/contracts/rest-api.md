# REST API

Base URL: `/api/v1`. Swagger: `/api/docs`.

## Public endpoints (mobile)

Auth не требуется (кроме rate limits на reviews).

### Home content

```
GET /home-content
```

**Response:** `HomeContentDto`

```json
{
  "totalMarketCap": "$2.84T",
  "totalMarketCapChange24h": 1.8,
  "altcoinSeasonIndex": 38,
  "altcoinSeasonLabel": "Bitcoin Season",
  "fearGreedValue": 72,
  "fearGreedLabel": "Greed",
  "socialLinks": [{ "id": "telegram", "label": "Telegram", "url": "https://t.me/...", "icon": "telegram" }],
  "btcPrice": 0,
  "btcChange24h": 1.8,
  "btcMarketCap": "$2.84T",
  "btcVolume": "—",
  "ticker": []
}
```

Legacy `btc*` / `ticker` fields are kept for older mobile builds; new clients should use `totalMarketCap*` and `altcoinSeason*`.

Mobile dashboard **market metrics** (cap, altcoin season, fear & greed) come from `GET /market-metrics`, not from admin `HomeContent` fields.

### Market metrics

```
GET /market-metrics
```

**Response:** `MarketMetricsDto`

```json
{
  "totalMarketCap": "$2.84T",
  "totalMarketCapChange24h": 1.8,
  "altcoinSeasonIndex": 38,
  "altcoinSeasonLabel": "Bitcoin Season",
  "fearGreedValue": 72,
  "fearGreedLabel": "Greed",
  "totalVolume24h": "$79.90B",
  "btcPrice": "$63,067",
  "btcChange24h": 3.4,
  "marketCapChart24h": [
    { "timestamp": 1781091597003, "valueUsd": 2180000000000 },
    { "timestamp": 1781177967000, "valueUsd": 2240000000000 }
  ]
}
```

- Aggregated server-side from CoinGecko (global, markets, charts) + Alternative.me Fear & Greed
- Optional env `COINGECKO_API_KEY` (Demo: header `x-cg-demo-api-key`; Pro: `COINGECKO_API_TYPE=pro`) — без ключа действуют публичные лимиты
- `totalVolume24h` — global 24h trading volume (CoinGecko global)
- `btcPrice` / `btcChange24h` — Bitcoin spot price and 24h % change
- `marketCapChart24h` — ~48 points over last 24h; shape from CoinGecko BTC market cap scaled to current total market cap (global chart endpoint is Pro-only)
- `altcoinSeasonIndex` — [CMC Altcoin Season Index](https://coinmarketcap.com/charts/altcoin-season-index/) via `CMC_API_KEY` (`GET /v1/altcoin-season-index/latest`); fallback: CoinGecko 90d/30d proxy
- Redis cache TTL ~10 min; fallback to stale cache or admin `HomeContent` on provider errors

### Signals

```
GET /signals?marketType=spot|futures&status=live|open|active|closed
GET /signals/:id
```

| Query | Required | Default | Notes |
|-------|----------|---------|-------|
| `marketType` | yes | — | `spot` or `futures` |
| `status` | no | `live` | `live` = OPEN + ACTIVE; CANCELLED never returned |

**Response:** `SignalDto[]` or `SignalDto`

### Results

```
GET /results?marketType=spot|futures&timeframe=1W|1M|3M|6M|1Y
```

| Query | Required | Default |
|-------|----------|---------|
| `marketType` | yes | — |
| `timeframe` | no | `3M` |

**Response:** `ResultsResponse`

```json
{
  "summary": {
    "totalTrades": 27,
    "winTrades": 23,
    "lossTrades": 4,
    "winRate": 85.0,
    "totalProfit": 567.1
  },
  "signals": []
}
```

- `summary` — вычисляется из `CLOSED` сигналов в rolling window (`computeResultsSummary`)
- `signals` — только `status=CLOSED`, `closeDate` в rolling window timeframe

### Settings

```
GET /settings
GET /settings/menu
```

**GET /settings** → `{ disclaimer, telegramFabUrl? }`

**GET /settings/menu** → `MenuLinkDto[]` (только enabled, sorted by order)

### Reviews

```
GET /reviews/mine?deviceId=<device-id>
POST /reviews
```

**GET response:** `ReviewMineResponse` — `{ "review": ReviewDto | null }`

**POST body:** `ReviewCreateDto`

```json
{ "rating": 5, "comment": "Great signals!", "deviceId": "dev_..." }
```

**POST response:** `ReviewDto` — создаёт или обновляет отзыв для `deviceId` (один отзыв на устройство).

Mobile stores `ReviewDto` locally (AsyncStorage) and hides "Rate app", showing "Edit review" instead.

### Client errors (mobile telemetry)

```
POST /client-errors
```

Rate limit: `public-write` (30/min per IP).

**Body:** `ClientErrorCreateDto`

```json
{
  "kind": "RENDER",
  "message": "Cannot read property 'toLocaleString' of undefined",
  "stack": "...",
  "screen": "home",
  "apiPath": "/home-content",
  "deviceId": "dev_...",
  "platform": "android",
  "appVersion": "1.0.0"
}
```

`kind`: `RENDER` | `QUERY` | `MUTATION` | `NETWORK` | `JSON`

**Response:** `{ "ok": true, "id": "uuid" }`

Mobile sends errors from `request()` failures and `AppErrorBoundary` (render crashes). Duplicates are deduped client-side (~5 min).

### Devices (push tokens)

```
POST /devices/register
DELETE /devices/unregister
```

**POST body:**

```json
{ "pushToken": "ExponentPushToken[...]", "platform": "android", "deviceId": "optional" }
```

**DELETE body:**

```json
{ "pushToken": "ExponentPushToken[...]" }
```

> Единственный способ регистрации push token. WS не используется для tokens.

### Price watch

```
GET    /price-watch?deviceId=<device-id>
POST   /price-watch/watchlist
DELETE /price-watch/watchlist/:id?deviceId=<device-id>
POST   /price-watch/alerts
DELETE /price-watch/alerts/:id?deviceId=<device-id>
POST   /price-watch/alerts/from-signal
```

**GET response:** `PriceWatchStateDto` — `watchlist` (max 10), active `alerts`, snapshot `tickers`.

**POST watchlist body:** `{ "deviceId": "...", "pair": "BTC/USDT", "marketType": "FUTURES" | "SPOT" }`

**POST alerts body:** `{ "deviceId", "pair", "marketType", "targetPrice", "condition": "ABOVE" | "BELOW" | "AT" }`

**POST alerts/from-signal body:** `{ "deviceId", "signalId" }` — creates `AT` alert on signal `entryPrice`.

Prices streamed server-side from **Bybit public API**; mobile receives live ticks via WS `price:ticker` on channel `prices:device:{deviceId}`.

---

## Integration endpoints (signalsBot / external)

Auth: header `X-API-Key` = env `INTEGRATIONS_API_KEY` on API service.

```
POST   /integrations/signals
PATCH  /integrations/signals/:externalId
```

### POST /integrations/signals

Upsert by `externalId`: if signal with this `externalId` already exists, returns existing row (idempotent).

**Body:**

```json
{
  "externalId": "clx_signalsbot_id",
  "source": "Binance Killers",
  "pair": "BTC / USDT",
  "marketType": "FUTURES",
  "direction": "LONG",
  "entryPrice": 65000,
  "capitalPercentage": 2,
  "leverage": 5,
  "positionSizeUsdt": 200,
  "realizedPnlUsdt": 12.5,
  "profitPercentage": 31.25,
  "status": "CLOSED",
  "closeDate": "2026-05-31T12:00:00Z",
  "openDate": "2026-05-31T10:00:00Z",
  "details": {
    "targets": [
      { "label": "Target 01", "price": 65500, "profitPercent": 0.8, "hit": false }
    ],
    "stopLoss": 63000
  }
}
```

**Response:** `SignalDto` (201 semantics via upsert — existing returns 200).

### PATCH /integrations/signals/:externalId

Partial update; same execution fields as admin PATCH. Triggers `SignalEventService` (WS + push).

**Trade metrics (bb-trader sync):**

| Field | Notes |
|-------|-------|
| `positionSizeUsdt` | Entry notional (bb-trader `orderUsd`) |
| `realizedPnlUsdt` | Absolute PnL at close |
| `profitPercentage` | Optional on wire; API recalculates when PnL + size present |

**Status mapping (signalsBot → QPulse):**

| bb-trader | QPulse |
|-----------|--------|
| `PENDING`, `PARSED`, `ORDERS_PLACED` (no fill) | `OPEN` |
| spot `OPEN`, futures filled entry | `ACTIVE` |
| `CLOSED_*`, liquidation | `CLOSED` (+ `closeDate`) |
| `FAILED`, `*CANCEL*` | `CANCELLED` |

**Errors:**

| Code | When |
|------|------|
| 401 | Missing/invalid `X-API-Key` |
| 404 | Unknown `externalId` |

---

## Admin endpoints (JWT)

Header: `Authorization: Bearer <accessToken>`

Refresh token — httpOnly cookie на auth endpoints.

### Auth

```
POST   /admin/auth/login      # { email, password } → { accessToken, user } + refresh cookie
POST   /admin/auth/refresh    # cookie → new accessToken
POST   /admin/auth/logout     # invalidate refresh
GET    /admin/auth/me         # current AdminUserDto
```

Access TTL: 15 min. Refresh: 7 days.

### Dashboard

```
GET /admin/dashboard
```

Counts: live signals, closed, cancelled, pending reviews, recent push events.

### Signals CRUD

```
GET|POST       /admin/signals?status=open|active|closed|cancelled&marketType=spot|futures
POST           /admin/signals/batch-delete   # { "ids": ["uuid", ...] } max 100
GET|PATCH|DELETE /admin/signals/:id
```

**PATCH body (execution fields):**

```json
{
  "status": "CLOSED",
  "currentTpLevel": 3,
  "slHit": false,
  "liquidated": false,
  "leverage": 5,
  "profitPercentage": 30.0,
  "positionSizeUsdt": 100.0,
  "realizedPnlUsdt": 15.0,
  "targetHitLabel": "Tp 3 Hit",
  "closeDate": "2026-05-20T00:00:00Z",
  "details": {
    "targets": [{ "label": "Target 01", "price": 0.255, "profitPercent": 3 }],
    "stopLoss": 0.231
  }
}
```

**Validation rules:**
- `closeDate` required when `status=CLOSED`
- `liquidated=true` only when `status=CLOSED`; forces `slHit=false`
- On create/update/delete → `SignalEventService` → WS + BullMQ (async push)

**DELETE:** hard delete; WS `signal:deleted`; no push.

**Batch delete:** same semantics per id; returns `{ ok: true, deleted: N }`.

### Results (admin UI)

Admin **Results** page uses public `GET /results` (computed summary + closed signals). Manual `ResultsSummary` CRUD removed.

### Menu links

```
GET|POST|PATCH|DELETE /admin/menu-links
GET|POST|PATCH|DELETE /admin/menu-links/:id
```

### Results summary

Removed — summary is computed from closed signals (`GET /results`).

### Reviews moderation

```
GET    /admin/reviews
DELETE /admin/reviews/:id
GET    /admin/client-errors?limit=100
```

### Home content

```
GET   /admin/home-content
PATCH /admin/home-content
```

### App settings

```
GET   /admin/settings
PATCH /admin/settings
```

Fields: `disclaimer`, `telegramFabUrl`.

### Notification templates & log

```
GET   /admin/notification-templates
PATCH /admin/notification-templates/:eventType
GET   /admin/notifications/log
```

---

## SignalDto shape

```json
{
  "id": "uuid",
  "pair": "ADA / USDT",
  "marketType": "SPOT",
  "direction": null,
  "action": "BUY",
  "entryPrice": 0.248,
  "capitalPercentage": 2,
  "leverage": null,
  "openDate": "2026-05-20T00:00:00Z",
  "closeDate": null,
  "status": "OPEN",
  "currentTpLevel": null,
  "slHit": false,
  "liquidated": false,
  "targetHitLabel": null,
  "profitPercentage": null,
  "logoUrl": null,
  "details": {
    "targets": [{ "label": "Target 01", "price": 0.255, "profitPercent": 3 }],
    "stopLoss": 0.231
  },
  "createdAt": "2026-05-20T00:00:00Z",
  "updatedAt": "2026-05-20T00:00:00Z"
}
```

## Error responses

Standard NestJS format:

```json
{
  "statusCode": 400,
  "message": ["closeDate is required when status is CLOSED"],
  "error": "Bad Request"
}
```

| Code | When |
|------|------|
| 400 | Validation error |
| 401 | Missing/invalid JWT (admin) |
| 404 | Resource not found |
| 429 | Rate limit (reviews, devices) |
