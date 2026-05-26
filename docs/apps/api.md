# API App (NestJS)

`apps/api` — NestJS 11 backend: REST, WebSocket, BullMQ push worker, Prisma ORM.

## Stack

| Package | Version | Purpose |
|---------|---------|---------|
| NestJS | ^11.1 | Framework |
| Prisma | 7.8 | ORM |
| @nestjs/websockets + socket.io | — | Realtime |
| @nestjs/bullmq + bullmq | ^5 | Push queue |
| ioredis | — | Redis client |
| @qpulse/shared | workspace | DTOs, enums |

## Entry point

- Global prefix: `/api/v1`
- Swagger: `/api/docs`
- Port: `3001` (env `PORT`)

## Module map

```
src/
├── auth/              JWT login, refresh, logout, me
├── admin/             Dashboard counts
├── signals/           Public read + admin CRUD + event trigger
├── results/           Public results + admin results-summary CRUD
├── home-content/      Public read + admin PATCH
├── settings/          Public settings/menu + admin menu-links/settings
├── reviews/           Public POST + admin moderation
├── devices/           Push token register/unregister
├── events/            SignalEventService (priority rules)
├── realtime/          WebSocket Gateway + Redis pub/sub
├── queue/             BullMQ module registration
├── notifications/     PushProcessor + admin templates/log
└── prisma/            PrismaService
```

## Signal update flow

```
AdminController PATCH
  → SignalsService.update()
  → Prisma persist
  → SignalEventService.handleUpdate(before, after)
      → resolveEvent() — one SignalEventType
      → SignalEventLog.create()
      → RealtimeGateway.broadcast('signal:updated', dto, channels)
      → RealtimeGateway.broadcast('signal:event', {...}, channels)  [if event]
      → pushQueue.add('push', { eventType, signalId, payload })
  → return 200 (push async)
```

Create: `handleCreate()`. Delete: `handleDelete()` → WS `signal:deleted` only (no push).

## SignalEventService priority

See [push-events.md](../contracts/push-events.md). Implementation: `src/events/signal-event.service.ts`.

## RealtimeGateway

- Path: `/api/v1/realtime`
- Redis channel: `qpulse:ws`
- Subscribe handler joins Socket.io rooms by channel name

## BullMQ

- Queue name: `push-notifications`
- Processor: `PushProcessor` in `notifications/push.processor.ts`
- Job data: `PushJobPayload`
- Retry: 3× exponential backoff

## Query param mapping

Public controllers use lowercase query values. Mapping in `common/utils/query-params.ts` and services.

## Validation

- Global `ValidationPipe`: transform + whitelist
- Business rules in services:
  - `closeDate` required when `status=CLOSED`
  - `liquidated=true` only when `CLOSED`; force `slHit=false`

## Auth

- JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- `@UseGuards(JwtAuthGuard)` on all `/admin/*` except auth login/refresh
- Refresh token hash stored in `AdminUser.refreshTokenHash`

## Env

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
ADMIN_URL=http://localhost:3000
EXPO_ACCESS_TOKEN=...   # Expo Push API
PORT=3001
```

## Commands

```bash
pnpm --filter api dev
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
pnpm --filter api build
```

## Docker

`apps/api/Dockerfile` for Railway deployment.

## Conventions

- Map Prisma models → DTOs via `common/mappers/signal.mapper.ts`
- Never duplicate enums — import from `@qpulse/shared` or `@prisma/client`
- Contract changes → update `docs/contracts/*`
