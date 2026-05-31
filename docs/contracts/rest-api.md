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
  "socialLinks": [{ "id": "telegram", "label": "Telegram", "url": "https://t.me/...", "icon": "telegram" }]
}
```

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

- `summary` — из таблицы `ResultsSummary` (не вычисляется)
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
  "status": "OPEN",
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

### Menu links

```
GET|POST|PATCH|DELETE /admin/menu-links
GET|POST|PATCH|DELETE /admin/menu-links/:id
```

### Results summary

```
GET|POST /admin/results-summary
PATCH    /admin/results-summary/:marketType/:timeframe
DELETE   /admin/results-summary/:marketType/:timeframe
```

Composite key: `marketType` (spot/futures) + `timeframe` (1W|1M|3M|6M|1Y).

### Reviews moderation

```
GET    /admin/reviews
DELETE /admin/reviews/:id
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
