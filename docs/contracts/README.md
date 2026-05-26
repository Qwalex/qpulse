# API Contracts

Контракты QPulse — формальное описание REST, WebSocket, push-событий и shared types.

## Versioning

- Base path: **`/api/v1`**
- Breaking changes → новая major version (`/api/v2`) + migration guide
- Non-breaking (новые optional fields) — в рамках v1

## Source of truth

| Контракт | Код | Документация |
|----------|-----|--------------|
| TypeScript types | `packages/shared/src/index.ts` | [shared-types.md](shared-types.md) |
| Database schema | `apps/api/prisma/schema.prisma` | [prisma-schema.md](prisma-schema.md) |
| REST endpoints | NestJS controllers | [rest-api.md](rest-api.md) |
| WebSocket | `RealtimeGateway` | [websocket.md](websocket.md) |
| Push events | `SignalEventService` + templates | [push-events.md](push-events.md) |

**Правило:** при изменении кода обнови соответствующий doc-файл в том же PR.

## Contract files

| File | Содержание |
|------|------------|
| [rest-api.md](rest-api.md) | Method, path, auth, query, body, response, errors |
| [websocket.md](websocket.md) | Subscribe, channels, message types, reconnect |
| [push-events.md](push-events.md) | SignalEventType, priority rules, templates, channels |
| [shared-types.md](shared-types.md) | Enums, DTOs, WS payloads |
| [prisma-schema.md](prisma-schema.md) | Models, relations, seed data |

## Query param conventions

Public API использует **lowercase** query values, маппинг в Prisma enums на backend:

| API query | Prisma / behavior |
|-----------|-------------------|
| `marketType=spot` | `SPOT` (required на `/signals`, `/results`) |
| `marketType=futures` | `FUTURES` (required) |
| `status=live` | `OPEN` + `ACTIVE` |
| `status=open` | `OPEN` |
| `status=active` | `ACTIVE` |
| `status=closed` | `CLOSED` |
| `timeframe=1W\|1M\|3M\|6M\|1Y` | только `/results` |

## Swagger

Runtime OpenAPI: `GET /api/docs` (при запущенном API). Дополняет, но не заменяет `rest-api.md`.
