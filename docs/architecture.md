# QPulse Architecture

Monorepo: **Expo SDK 55** (mobile) + **NestJS 11** (API) + **Next.js 16** (admin). Данные — только **PostgreSQL 18**. Realtime — **WebSocket + Redis pub/sub**. Push — **BullMQ + Expo Push API**.

## High-level diagram

```mermaid
flowchart TB
  subgraph mobileApp [apps/mobile]
    MobileUI[UI screens]
    WSClient[WebSocket client]
    PushClient[expo-notifications]
  end

  subgraph adminApp [apps/admin]
    AdminUI[Next.js CRUD]
  end

  subgraph apiLayer [apps/api]
    REST[REST API]
    WSGateway[WebSocket Gateway]
    EventBus[SignalEventService]
    PushQueue[BullMQ push queue]
    PushWorker[PushWorker]
  end

  DB[(PostgreSQL 18)]
  Redis[(Redis 7)]

  AdminUI -->|REST JWT| REST
  MobileUI -->|REST| REST
  MobileUI <-->|WS subscribe| WSGateway
  PushClient -->|register token| REST

  REST --> DB
  REST --> EventBus
  EventBus --> WSGateway
  EventBus -->|enqueue job| PushQueue
  PushQueue --> Redis
  PushWorker --> Redis
  PushWorker -->|Expo Push API| PushClient
  PushWorker --> DB
  WSGateway --> Redis
```

## Monorepo structure

```
QPulse/
├── apps/
│   ├── mobile/          # Expo SDK 55 — UI + WS + push
│   ├── api/             # NestJS — REST + WS + BullMQ
│   └── admin/           # Next.js 16 — CRUD
├── packages/
│   └── shared/          # DTOs, enums, WS payloads (source of truth)
├── docs/                # Architecture, contracts, runbooks
├── AGENTS.md
├── tasks.md
├── .cursor/rules/
├── docker-compose.yml   # PostgreSQL 18 + Redis 7
└── turbo.json
```

**Инструменты:** pnpm workspaces + Turborepo. Node **24.16.0** LTS (`.nvmrc`).

## Data flow: admin update → mobile

```mermaid
sequenceDiagram
  participant Admin as Admin Panel
  participant API as NestJS API
  participant DB as PostgreSQL
  participant Events as SignalEventService
  participant WS as WebSocket Gateway
  participant Queue as BullMQ
  participant Worker as PushWorker
  participant Mobile as Mobile App

  Admin->>API: PATCH /admin/signals/:id
  API->>DB: update signal + log event
  API->>Events: resolve dominant event (priority rules)
  Events->>WS: broadcast signal:updated (+ signal:event)
  Events->>Queue: add push-notifications job
  API-->>Admin: 200 OK (не ждёт push)
  WS-->>Mobile: signal:updated (instant UI)
  Queue->>Worker: process job
  Worker->>DB: templates + device tokens
  Worker-->>Mobile: Expo Push (background)
```

## Redis — две роли

| Роль | Назначение |
|------|------------|
| **BullMQ backend** | Очередь `push-notifications`, retry jobs |
| **Pub/sub** (`qpulse:ws`) | Broadcast WebSocket между несколькими инстансами API |

Без Redis pub/sub при horizontal scaling часть клиентов не получит WS update.

## Signal lifecycle

| Status | Mobile | Описание |
|--------|--------|----------|
| `OPEN` | Spots/Futures (live) | Ордера выставлены |
| `ACTIVE` | Spots/Futures (live) | Позиции активны |
| `CLOSED` | Results only | Закрыта; требует `closeDate` |
| `CANCELLED` | Скрыт | Только админка |

**`liquidated`:** boolean, только при `status=CLOSED`. При `liquidated=true` backend принудительно `slHit=false`.

## Results model

- **Summary** — готовые значения из `ResultsSummary` (ключ `marketType + timeframe`). MVP: админ редактирует вручную.
- **Список** — `Signal WHERE status=CLOSED`, фильтр по `marketType` + rolling window `closeDate` (timeframe 1W–1Y).

Timeframe — **контекст Results**, не поле Signal.

## NestJS API modules

```
apps/api/src/
├── signals/           # CRUD (admin) + public read + event emit
├── results/           # ResultsSummary + closed signals by closeDate
├── home-content/      # BTC stats, ticker, social links
├── settings/          # menu links + disclaimer, telegramFabUrl
├── reviews/           # POST review + admin moderation
├── devices/           # push token register/unregister
├── auth/              # JWT admin auth
├── realtime/          # WebSocket Gateway + Redis pub/sub
├── queue/             # BullMQ module
├── notifications/     # PushWorker + admin templates/log
└── events/            # SignalEventService — diff → WS + BullMQ
```

## Deployment (Railway)

| Service | Описание |
|---------|----------|
| `apps/api` | Web service, Dockerfile |
| `apps/admin` | Next.js standalone |
| PostgreSQL 18 | Railway plugin |
| Redis 7 | Railway plugin |

Подробности: [runbooks/deploy-railway.md](runbooks/deploy-railway.md).

## Backlog (не в текущей итерации)

- Charts tab
- ExternalSignalsAdapter
- Auto-sync ResultsSummary при закрытии сигнала
- Multi-admin / RBAC
- BullMQ dead letter queue
- E2E API tests
