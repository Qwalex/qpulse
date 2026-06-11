# Prisma Schema

**Source of truth:** `apps/api/prisma/schema.prisma`

Provider: PostgreSQL 18. ORM: Prisma 7.8.

## Enums

| Enum | Values |
|------|--------|
| `MarketType` | SPOT, FUTURES |
| `Direction` | LONG, SHORT |
| `SignalStatus` | OPEN, ACTIVE, CLOSED, CANCELLED |
| `ResultsTimeframe` | ONE_W, ONE_M, THREE_M, SIX_M, ONE_Y |
| `SignalEventType` | SIGNAL_CREATED, SIGNAL_UPDATED, TP_HIT, SL_HIT, LIQUIDATED, SIGNAL_CLOSED, SIGNAL_CANCELLED |
| `MenuActionType` | EXTERNAL_LINK, INTERNAL_ROUTE |

## Models

### Signal

Core trading signal. Admin CRUD only.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| pair | String | e.g. "ADA / USDT" |
| marketType | MarketType | SPOT \| FUTURES |
| direction | Direction? | Futures: LONG \| SHORT |
| action | String? | Spot: BUY \| SELL |
| entryPrice | Decimal | |
| capitalPercentage | Float | |
| leverage | Int? | Admin-editable |
| openDate | DateTime | |
| closeDate | DateTime? | Required when CLOSED |
| status | SignalStatus | |
| currentTpLevel | Int? | TP 1-4 reached |
| slHit | Boolean | default false |
| liquidated | Boolean | default false; only valid when CLOSED |
| targetHitLabel | String? | e.g. "Tp 4 Hit" |
| profitPercentage | Float? | |
| logoUrl | String? | |
| details | Json? | `{ targets[], stopLoss }` |
| events | SignalEventLog[] | relation |

### ResultsSummary

Pre-computed stats per market + timeframe. **Not computed on read.**

Composite PK: `(marketType, timeframe)`.

| Field | Type |
|-------|------|
| totalTrades, winTrades, lossTrades | Int |
| winRate, totalProfit | Float |

### SignalEventLog

Audit trail of semantic events.

| Field | Type |
|-------|------|
| signalId | FK → Signal |
| eventType | SignalEventType |
| payload | Json? |

### DeviceToken

| Field | Type | Notes |
|-------|------|-------|
| pushToken | String | unique, ExponentPushToken[...] |
| platform | String | android \| ios |
| deviceId | String? | |
| isActive | Boolean | default true |

### NotificationLog

Push delivery audit.

| Field | Type |
|-------|------|
| deviceId | String? |
| eventType | SignalEventType |
| title, body | String |
| status | String (sent \| failed \| queued \| skipped) |
| error | String? |

### NotificationTemplate

PK: `eventType`. One template per SignalEventType.

| Field | Type |
|-------|------|
| titleTpl, bodyTpl | String (Handlebars-like `{{var}}`) |
| channel | String |
| priority | String |
| deepLink | String |

### Review

| deviceId | String? unique — one review per device |

### WatchlistCoin

| Field | Type |
|-------|------|
| deviceId | String |
| symbol | String (Bybit, e.g. BTCUSDT) |
| pairLabel | String (display, e.g. BTC/USDT) |
| marketType | MarketType |
| sortOrder | Int |

Unique: `[deviceId, symbol, marketType]`. Max 10 per device (API enforced).

### PriceAlert

| Field | Type |
|-------|------|
| targetPrice | Decimal |
| condition | PriceAlertCondition (`ABOVE` \| `BELOW` \| `AT`) |
| source | PriceAlertSource (`MANUAL` \| `SIGNAL_ENTRY`) |
| signalId | String? |
| isActive | Boolean |
| lastPrice | Decimal? (for cross detection) |

### HomeContent

Singleton (`id = "default"`). All Home screen data from admin.

| Field | Type |
|-------|------|
| totalMarketCap | String |
| totalMarketCapChange24h | Float |
| altcoinSeasonIndex | Int (0–100) |
| altcoinSeasonLabel | String |
| fearGreedValue | Int (0–100) |
| fearGreedLabel | String |
| socialLinks | Json |

### MenuLink

Settings menu items. PK: string id (e.g. `crypto_news`).

| Field | Type |
|-------|------|
| label, icon | String |
| actionType | MenuActionType |
| url | String? (EXTERNAL_LINK) |
| route | String? (INTERNAL_ROUTE) |
| order | Int |
| isEnabled | Boolean |

### Review

| Field | Type |
|-------|------|
| rating | Int (1-5) |
| comment | String? |
| deviceId | String? |

Index: `(deviceId, createdAt)` for rate limiting.

### AppSettings

Singleton (`id = "default"`).

| Field | Type |
|-------|------|
| disclaimer | String (Risk banner) |
| telegramFabUrl | String? |

### AdminUser

Single admin in MVP (no RBAC).

| Field | Type |
|-------|------|
| email | String unique |
| passwordHash | String |
| refreshTokenHash | String? |

## Entity relationships

```
Signal 1──* SignalEventLog
(others are standalone or singletons)
```

## Seed data (MVP)

`pnpm --filter api prisma db seed` creates:

- Signals: OPEN, ACTIVE, CLOSED (incl. liquidated), CANCELLED
- ResultsSummary: 10 rows (5 timeframes × 2 markets)
- MenuLink: 8 items (Instagram disabled)
- HomeContent: default market metrics + social links
- NotificationTemplate: all SignalEventTypes
- AdminUser: single admin account
- AppSettings: disclaimer + telegramFabUrl

## Migrations

```bash
pnpm --filter api prisma migrate dev --name <description>
pnpm --filter api prisma generate
```

Schema change checklist:
1. Update `schema.prisma`
2. Run migration
3. Update `packages/shared` if enums/DTOs affected
4. Update `docs/contracts/prisma-schema.md` + `shared-types.md`
5. Update seed if needed
