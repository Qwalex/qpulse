# Runbook: Add Signal Event Type

Добавление нового `SignalEventType` для push + WS semantic events.

## When needed

New business event requiring distinct push notification (e.g. future `PARTIAL_CLOSE`). Most signal changes use existing types via priority rules.

## Checklist (all steps required)

### 1. Prisma enum

`apps/api/prisma/schema.prisma`:

```prisma
enum SignalEventType {
  // ...existing
  MY_NEW_EVENT
}
```

```bash
pnpm --filter api prisma migrate dev --name add-my-new-event
```

### 2. Shared package

`packages/shared/src/index.ts`:

```typescript
export enum SignalEventType {
  // ...
  MY_NEW_EVENT = 'MY_NEW_EVENT',
}
```

### 3. SignalEventService priority

`apps/api/src/events/signal-event.service.ts`:

1. Add to `PRIORITY` array at correct rank
2. Add detection logic in `resolveEvent()` comparing `before` vs `after`

```typescript
const PRIORITY: SignalEventType[] = [
  // higher priority first
  SignalEventType.MY_NEW_EVENT,
  // ...
];
```

### 4. Notification template seed

`apps/api/prisma/seed.ts` — add `NotificationTemplate`:

```typescript
{
  eventType: 'MY_NEW_EVENT',
  titleTpl: 'New Event',
  bodyTpl: '{{pair}} — something happened',
  channel: 'signals_updates',
  priority: 'default',
  deepLink: '/signals/{{id}}',
}
```

Re-seed or insert via admin API.

### 5. Android channel (if new category)

If event needs new notification channel, document in [push-events.md](../contracts/push-events.md) and configure in mobile expo-notifications setup.

### 6. Documentation

Update in same PR:
- `docs/contracts/push-events.md` — event table + priority
- `docs/contracts/shared-types.md` — enum
- `docs/contracts/prisma-schema.md` — enum

### 7. Admin UI (optional)

`/notifications` page should list new template after seed. PATCH endpoint works without UI changes.

### 8. Test

1. Create/update signal triggering new condition
2. Verify `SignalEventLog` row with correct `eventType`
3. Verify WS `signal:event` payload
4. Verify BullMQ job enqueued
5. Verify `NotificationLog` entry

## Priority rules reminder

Only **one** event emitted per update. Higher priority wins. See full list in [push-events.md](../contracts/push-events.md).

## Related files

| File | Change |
|------|--------|
| `schema.prisma` | enum |
| `packages/shared` | enum export |
| `signal-event.service.ts` | detection + priority |
| `seed.ts` | NotificationTemplate |
| `push-events.md` | documentation |

## Do NOT

- Emit multiple push jobs for one admin PATCH
- Add event types without template seed (PushWorker skips missing template)
- Duplicate enum in api/admin/mobile — use `@qpulse/shared`
