# QPulse — Guide for AI Agents

Краткий entry point для AI-агентов. Детали — в `.cursor/rules/` и `docs/`.

## Before you code

1. Прочитай `tasks.md` — возьми задачу или создай новую, установи `Status: in_progress`.
2. Прочитай `docs/architecture.md` и релевантные `docs/contracts/*`.
3. Прочитай `packages/shared` — **никогда не дублируй типы локально**.

## Monorepo map

| Path | Stack | Назначение |
|------|-------|------------|
| `apps/mobile` | Expo SDK 55, expo-router | UI, WebSocket, push |
| `apps/api` | NestJS 11, Prisma, BullMQ | REST, WS, push worker |
| `apps/admin` | Next.js 16, Tailwind v4 | CRUD админка |
| `packages/shared` | TypeScript | DTOs, enums, WS payloads — **SOURCE OF TRUTH** |

## Non-negotiable rules

- **Нет внешних market API** (CoinGecko, Alternative.me и т.п.) — все данные из PostgreSQL через админку.
- **Signal CRUD только в admin** — статусы `OPEN` / `ACTIVE` / `CLOSED` / `CANCELLED`; флаг `liquidated` для закрытия по ликвидации; `CANCELLED` скрыт от mobile.
- **Menu items** → модель `MenuLink`; social links на Home → `HomeContent.socialLinks` (без WhatsApp).
- **Push token** → только `POST /devices/register`. WebSocket — только subscribe/broadcast.
- **Phase 1:** Prisma + seed, без mock-файлов.
- **Contract change** → обнови `docs/contracts/*` в том же PR/коммите.
- **Stack:** Node 24 LTS, PostgreSQL 18, Redis 7 — без beta-зависимостей.

## Signal events (кратко)

При create/update/delete сигнала `SignalEventService` определяет **один** доминирующий `SignalEventType` по priority rules, эмитит WebSocket (`signal:updated`, опционально `signal:event`) и ставит **один** BullMQ job. Подробности: `docs/contracts/push-events.md`.

## When done

- Обнови `tasks.md` (`Status: done` + notes).
- Обнови docs, если менялись контракты.
- Запусти: `pnpm lint && pnpm typecheck` (релевантные пакеты).

## Полезные ссылки

- [Architecture](docs/architecture.md)
- [Getting started](docs/getting-started.md)
- [REST API contracts](docs/contracts/rest-api.md)
- [Task tracker](tasks.md)
