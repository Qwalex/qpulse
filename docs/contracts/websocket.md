# WebSocket Protocol

Endpoint: **`/api/v1/realtime`** (Socket.io).

Env mobile: `EXPO_PUBLIC_WS_URL=ws://host:3001/api/v1/realtime` (prod: `wss://`).

## Connection

```typescript
import { io } from 'socket.io-client';

const socket = io(WS_URL, { path: '/api/v1/realtime' });
```

CORS: `origin: *` (mobile clients).

## Client → Server

### Subscribe to channels

Event name: `subscribe`

```json
{
  "type": "subscribe",
  "channels": ["signals:spot", "signals:futures", "signals:all"]
}
```

**Channels:**

| Channel | Receives updates for |
|---------|---------------------|
| `signals:spot` | SPOT market signals |
| `signals:futures` | FUTURES market signals |
| `signals:all` | All markets |
| `prices:device:{deviceId}` | Live price ticks for device watchlist/alerts |

**Response:** `{ "ok": true }`

> Push token registration — **только REST** `POST /devices/register`. WS не принимает tokens.

## Server → Client

Event names match `type` field. Payload in Socket.io `data` argument.

### signal:created

```json
{
  "type": "signal:created",
  "payload": { /* SignalDto */ }
}
```

### signal:updated

Emitted on every create/update. Mobile should invalidate TanStack Query cache.

```json
{
  "type": "signal:updated",
  "payload": { /* SignalDto */ }
}
```

### signal:deleted

On admin hard delete.

```json
{
  "type": "signal:deleted",
  "payload": { "signalId": "uuid" }
}
```

### signal:event

Semantic event (for toast/badge logic). One dominant event per update (see push-events.md priority rules).

```json
{
  "type": "signal:event",
  "payload": {
    "eventType": "TP_HIT",
    "signalId": "uuid",
    "tpLevel": 3
  }
}
```

### price:ticker

Live price update for watchlist / alerts (Bybit feed via API).

```json
{
  "type": "price:ticker",
  "payload": {
    "symbol": "BTCUSDT",
    "pairLabel": "BTC/USDT",
    "marketType": "FUTURES",
    "price": 63000.5,
    "change24hPct": 2.1,
    "updatedAt": "2026-06-11T12:00:00.000Z"
  }
}
```

Subscribe to `prices:device:{deviceId}` after resolving local `deviceId`.

## Multi-instance scaling

`RealtimeGateway` publishes to Redis channel `qpulse:ws`. All API instances subscribe and emit to their local Socket.io clients.

```
Instance A receives admin PATCH
  → broadcast locally
  → Redis PUBLISH qpulse:ws
Instance B receives Redis message
  → broadcast to its clients
```

## Mobile integration

Hook: `useSignalRealtime` in `apps/mobile`:

1. Connect on mount, disconnect on unmount
2. Subscribe to `signals:spot`, `signals:futures`, `signals:all`
3. On any signal event → `queryClient.invalidateQueries(['signals', ...])`
4. Exponential reconnect: 1s → 2s → 4s → … cap 30s

## WS vs Push

| Channel | When | Purpose |
|---------|------|---------|
| WebSocket | App foreground/active | Instant UI refresh |
| Push (BullMQ) | Background/closed | OS notification |

WebSocket **always** sends `signal:updated`. Push sends **one** notification per dominant `SignalEventType`.
