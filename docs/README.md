# QPulse Documentation

Документация monorepo QPulse: crypto signals app (Expo mobile + NestJS API + Next.js admin).

## Оглавление

### Общее

- [Architecture](architecture.md) — диаграммы, data flow, Redis/BullMQ/WebSocket
- [Getting started](getting-started.md) — prerequisites, install, docker, dev

### Контракты (`contracts/`)

Контракты — часть Definition of Done. Любое изменение API, WS, shared-types или Prisma **обязано** сопровождаться обновлением соответствующего файла.

- [Contracts overview](contracts/README.md) — как читать контракты, versioning
- [REST API](contracts/rest-api.md) — все endpoints, query params, примеры JSON
- [WebSocket](contracts/websocket.md) — subscribe, server→client events, reconnect
- [Push events](contracts/push-events.md) — SignalEventType, priority rules, Android channels
- [Shared types](contracts/shared-types.md) — зеркало `packages/shared`
- [Prisma schema](contracts/prisma-schema.md) — модели БД, enums, seed

### Приложения (`apps/`)

- [Mobile (Expo)](apps/mobile.md) — экраны, navigation, hooks, env
- [API (NestJS)](apps/api.md) — модули, events flow, BullMQ
- [Admin (Next.js)](apps/admin.md) — routes, auth, CRUD

### Runbooks (`runbooks/`)

- [Deploy on Railway](runbooks/deploy-railway.md)
- [Add menu link](runbooks/add-menu-link.md)
- [Add signal event type](runbooks/add-signal-event.md)
- [Local dev troubleshooting](runbooks/local-dev-troubleshooting.md)

## Принципы

1. **Single source of truth для типов:** `packages/shared` → импорт в api, admin, mobile.
2. **Contract-first:** контракт → код → docs (не наоборот).
3. **Swagger** (`/api/docs`) — runtime-дополнение к `rest-api.md`, не замена.
4. **Нет внешних market API** — все данные из PostgreSQL через админку.

## Для AI-агентов

См. [AGENTS.md](../AGENTS.md) и [tasks.md](../tasks.md) в корне репозитория.
