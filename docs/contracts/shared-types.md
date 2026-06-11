# Shared Types

**Source of truth:** `packages/shared/src/index.ts`

Import: `@qpulse/shared` in api, admin, mobile.

> При изменении типов обнови этот файл и все consumers в одном PR.

## Enums

### MarketType

```typescript
enum MarketType {
  SPOT = 'SPOT',
  FUTURES = 'FUTURES',
}
```

### Direction

```typescript
enum Direction {
  LONG = 'LONG',
  SHORT = 'SHORT',
}
```

### SignalStatus

```typescript
enum SignalStatus {
  OPEN = 'OPEN',       // orders placed
  ACTIVE = 'ACTIVE',   // positions active
  CLOSED = 'CLOSED',   // closed; requires closeDate
  CANCELLED = 'CANCELLED', // hidden from mobile
}
```

### ResultsTimeframe

```typescript
enum ResultsTimeframe {
  ONE_W = 'ONE_W',
  ONE_M = 'ONE_M',
  THREE_M = 'THREE_M',
  SIX_M = 'SIX_M',
  ONE_Y = 'ONE_Y',
}
```

API query mapping (`TIMEFRAME_API_MAP`):

| API | Enum |
|-----|------|
| `1W` | ONE_W |
| `1M` | ONE_M |
| `3M` | THREE_M |
| `6M` | SIX_M |
| `1Y` | ONE_Y |

Rolling window days (`TIMEFRAME_DAYS`): 7, 30, 90, 180, 365.

### SignalEventType

```typescript
enum SignalEventType {
  SIGNAL_CREATED = 'SIGNAL_CREATED',
  SIGNAL_UPDATED = 'SIGNAL_UPDATED',
  TP_HIT = 'TP_HIT',
  SL_HIT = 'SL_HIT',
  LIQUIDATED = 'LIQUIDATED',
  SIGNAL_CLOSED = 'SIGNAL_CLOSED',
  SIGNAL_CANCELLED = 'SIGNAL_CANCELLED',
}
```

### MenuActionType

```typescript
enum MenuActionType {
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  INTERNAL_ROUTE = 'INTERNAL_ROUTE',
}
```

## DTOs

### SignalDetails / SignalTarget

```typescript
interface SignalTarget {
  label: string;
  price: number;
  profitPercent: number;
  hit?: boolean; // true = TP level reached
}

interface SignalDetails {
  targets: SignalTarget[];
  stopLoss?: number;
}
```

- Per-target `hit` is stored in `details.targets[]`.
- Stop loss reached is `SignalDto.slHit` (admin: "SL reached" when `stopLoss` price is set).
- API derives `currentTpLevel` / `targetHitLabel` from the last hit target on save.

### SignalDto

Full signal representation for REST and WS payloads. See [rest-api.md](rest-api.md) for JSON example.

### ResultsSummaryDto / ResultsResponse

```typescript
interface ResultsSummaryDto {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  totalProfit: number;
}

interface ResultsResponse {
  summary: ResultsSummaryDto;
  signals: SignalDto[];
}
```

### MarketMetricsDto

Live dashboard metrics (total cap, altcoin season, fear & greed). Served by `GET /market-metrics` — aggregated from public providers with Redis cache; admin `HomeContent` is fallback only.

### HomeContentDto

Market metrics fields remain for admin fallback and legacy clients; **new mobile** reads metrics from `MarketMetricsDto` via `/market-metrics`. `socialLinks` array is admin-managed.

### AppSettingsDto

```typescript
interface AppSettingsDto {
  disclaimer: string;
  telegramFabUrl?: string | null;
}
```

### MenuLinkDto

```typescript
interface MenuLinkDto {
  id: string;
  label: string;
  icon: string;
  actionType: MenuActionType;
  url?: string | null;
  route?: string | null;
  order: number;
  isEnabled: boolean;
}
```

### ReviewCreateDto

```typescript
interface ReviewCreateDto {
  rating: number;      // 1-5
  comment?: string;
  deviceId?: string;
}
```

### ReviewDto / ReviewMineResponse

```typescript
interface ReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReviewMineResponse {
  review: ReviewDto | null;
}
```

`POST /reviews` with `deviceId` upserts one review per device.

### DeviceRegisterDto

```typescript
interface DeviceRegisterDto {
  pushToken: string;
  platform: string;    // android | ios
  deviceId?: string;
}
```

### AdminUserDto / AuthLoginResponse

```typescript
interface AdminUserDto {
  id: string;
  email: string;
}

interface AuthLoginResponse {
  accessToken: string;
  user: AdminUserDto;
}
```

## WebSocket message types

```typescript
interface WsSubscribeMessage {
  type: 'subscribe';
  channels: string[];
}

interface WsSignalCreated {
  type: 'signal:created';
  payload: SignalDto;
}

interface WsSignalUpdated {
  type: 'signal:updated';
  payload: SignalDto;
}

interface WsSignalDeleted {
  type: 'signal:deleted';
  payload: { signalId: string };
}

interface WsSignalEvent {
  type: 'signal:event';
  payload: {
    eventType: SignalEventType;
    signalId: string;
    tpLevel?: number;
    [key: string]: unknown;
  };
}

type WsServerMessage =
  | WsSignalCreated
  | WsSignalUpdated
  | WsSignalDeleted
  | WsSignalEvent;
```

## PushJobPayload

```typescript
interface PushJobPayload {
  eventType: SignalEventType;
  signalId: string;
  payload: Record<string, unknown>;
}
```

## Breaking change policy

1. Add optional fields — non-breaking
2. Rename/remove fields — bump shared package + update all apps + docs
3. New enum value — update Prisma schema, SignalEventService, templates seed, push-events.md
