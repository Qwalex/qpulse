# Push Events

Push-уведомления через **BullMQ** queue `push-notifications` → **PushWorker** → **Expo Push API**.

## Flow

1. Admin PATCH signal → `SignalEventService.resolveEvent()` → один доминирующий `SignalEventType`
2. WS broadcast (мгновенно)
3. BullMQ job: `{ eventType, signalId, payload: SignalDto }`
4. PushWorker: load template → render → send batch → `NotificationLog`
5. Retry: 3 attempts, exponential backoff (5s → 30s → 2min)

Admin HTTP response **не ждёт** push.

## SignalEventType

| Event | Trigger | Example title | Example body |
|-------|---------|---------------|--------------|
| `SIGNAL_CREATED` | New signal | New Signal | ADA/USDT — BUY at 0.248 |
| `SIGNAL_UPDATED` | Other field change | Signal Updated | ADA/USDT — entry changed |
| `TP_HIT` | `currentTpLevel` increased | TP 3 Hit | 1000TAGUSDT SHORT — TP 3 reached |
| `SL_HIT` | `slHit: false → true` | Stop Loss Hit | ADA/USDT — SL reached |
| `LIQUIDATED` | `liquidated: false → true` (CLOSED) | Liquidated | ETH/USDT LONG — position liquidated |
| `SIGNAL_CLOSED` | `status → CLOSED` (not liquidated/SL) | Signal Closed | +30.0% profit |
| `SIGNAL_CANCELLED` | `status → CANCELLED` | Signal Cancelled | LTC/USDT signal cancelled |

> `RESULT_ADDED` removed. CANCELLED signals hidden from mobile.

## Priority rules

При одном PATCH может сработать несколько условий — эмитится **один** event (высший приоритет):

```
1. SIGNAL_CANCELLED   (status → CANCELLED)
2. LIQUIDATED         (liquidated: false → true)
3. SL_HIT             (slHit: false → true)
4. SIGNAL_CLOSED      (status → CLOSED, if above didn't fire)
5. TP_HIT             (currentTpLevel increased)
6. SIGNAL_CREATED     (new record)
7. SIGNAL_UPDATED     (any other change, incl. OPEN→ACTIVE)
```

**Examples:**
- PATCH `status=CLOSED` + `liquidated=true` → **LIQUIDATED**
- PATCH `status=CLOSED` + `slHit=true` → **SL_HIT** (not SIGNAL_CLOSED)
- POST create with `status=CLOSED` + `liquidated=true` → **LIQUIDATED**

Implementation: `apps/api/src/events/signal-event.service.ts`

## NotificationTemplate

One row per `SignalEventType` (PK):

| Field | Description |
|-------|-------------|
| `titleTpl` | `"TP {{tpLevel}} Hit"` |
| `bodyTpl` | `"{{pair}} {{direction}} — TP {{tpLevel}} reached"` |
| `channel` | Android notification channel |
| `priority` | `high` \| `default` \| `low` |
| `deepLink` | Route on tap (MVP: market tab by marketType) |

Template variables from `SignalDto` payload: `pair`, `direction`, `action`, `tpLevel`, `profitPercentage`, etc.

## Android notification channels

| Channel | Events | Priority |
|---------|--------|----------|
| `signals_new` | SIGNAL_CREATED | high |
| `signals_tp` | TP_HIT | high |
| `signals_sl` | SL_HIT | high |
| `signals_liquidation` | LIQUIDATED | high |
| `signals_updates` | SIGNAL_UPDATED, SIGNAL_CLOSED, SIGNAL_CANCELLED | default |

## PushJobPayload

```typescript
interface PushJobPayload {
  eventType: SignalEventType;
  signalId: string;
  payload: Record<string, unknown>; // SignalDto as map
}
```

## NotificationLog

Each send attempt logged:

| Field | Values |
|-------|--------|
| `status` | `sent`, `failed`, `queued`, `skipped` |
| `error` | Expo API error message |

## Admin management

```
GET   /admin/notification-templates
PATCH /admin/notification-templates/:eventType
GET   /admin/notifications/log
```

MVP: templates seeded; UI editor — backlog.

## Adding a new event type

See runbook: [add-signal-event.md](../runbooks/add-signal-event.md).
