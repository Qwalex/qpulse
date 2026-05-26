# QPulse Tasks

> Agents: read [AGENTS.md](AGENTS.md) first. Update this file on every task state change.

## Active (in_progress)

_(пусто)_

## Backlog (pending)

_(пусто)_

## Blocked

_(пусто)_

## Done (recent)

## [TASK-013] Railway: починить API deploy
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** apps/api/Dockerfile, docs/runbooks/deploy-railway.md
- **Description:** API на Railway падал: неверный путь к prisma + CRLF в entrypoint.
- **Acceptance criteria:**
  - [x] Dockerfile копирует `apps/api/node_modules`, `docker-entrypoint.sh`
  - [x] `qpulse-api` Online, health + home-content + login OK
  - [x] Миграции + seed (RUN_SEED снова false)
- **Notes:** `railway up` с локального кода; закоммитьте Dockerfile в GitHub для CI deploy.
- **Updated:** 2026-05-26

## [TASK-001] Scaffold monorepo
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Scope:** root, docker-compose, turbo, pnpm
- **Description:** Инициализация monorepo (pnpm + turbo), .nvmrc Node 24 LTS, docker-compose PostgreSQL 18 + Redis 7.
- **Acceptance criteria:**
  - [x] pnpm workspace с apps/* и packages/*
  - [x] docker-compose up поднимает postgres + redis
  - [x] turbo.json с dev/build/lint/typecheck
- **Notes:** Root package.json, pnpm-workspace.yaml, .nvmrc, docker-compose.yml созданы.
- **Updated:** 2026-05-23

## [TASK-002] NestJS API modules
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Depends on:** TASK-001
- **Scope:** apps/api
- **Description:** NestJS 11 API: signals, results, home-content, settings, menu-links, reviews, devices, auth, Swagger.
- **Acceptance criteria:**
  - [x] Public + admin REST endpoints
  - [x] Global prefix `/api/v1`, Swagger на `/api/docs`
  - [x] Prisma integration, seed data
- **Notes:** Все модули в apps/api/src/, ValidationPipe, CORS настроен.
- **Updated:** 2026-05-23

## [TASK-003] Prisma schema + seed
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Depends on:** TASK-001
- **Scope:** apps/api/prisma
- **Description:** Prisma 7.8: Signal (OPEN/ACTIVE/CLOSED/CANCELLED, liquidated), ResultsSummary, events, device tokens, notification log/templates, MenuLink, HomeContent, AppSettings, AdminUser.
- **Acceptance criteria:**
  - [x] schema.prisma со всеми enums и моделями
  - [x] seed: signals всех статусов, ResultsSummary × 10, menu links, templates, admin user
- **Notes:** Seed в prisma/seed.ts.
- **Updated:** 2026-05-23

## [TASK-004] Shared package
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Scope:** packages/shared
- **Description:** Enums (SignalStatus, ResultsTimeframe, SignalEventType), DTOs, WS payloads, PushJobPayload, TIMEFRAME_API_MAP.
- **Acceptance criteria:**
  - [x] Экспорт из packages/shared/src/index.ts
  - [x] Импорт в api как @qpulse/shared
- **Notes:** Single source of truth для типов.
- **Updated:** 2026-05-23

## [TASK-005] Realtime WebSocket
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Depends on:** TASK-002
- **Scope:** apps/api/src/realtime, apps/api/src/events
- **Description:** Socket.io Gateway на `/api/v1/realtime`, Redis pub/sub для multi-instance, SignalEventService с priority rules.
- **Acceptance criteria:**
  - [x] subscribe channels: signals:spot, signals:futures, signals:all
  - [x] broadcast signal:updated, signal:deleted, signal:event
  - [x] Priority rules для доминирующего event type
- **Notes:** RealtimeGateway + SignalEventService реализованы.
- **Updated:** 2026-05-23

## [TASK-006] Push notifications (BullMQ)
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Depends on:** TASK-002, TASK-003
- **Scope:** apps/api/src/queue, apps/api/src/notifications, apps/api/src/devices
- **Description:** BullMQ queue push-notifications, PushWorker, DeviceToken API, NotificationTemplate seed, NotificationLog, retry 3× exponential backoff.
- **Acceptance criteria:**
  - [x] POST /devices/register, DELETE /devices/unregister
  - [x] Job enqueue из SignalEventService (async, не блокирует admin response)
  - [x] Admin endpoints для templates и log
- **Notes:** PushProcessor рендерит шаблоны; Expo API send — при наличии EXPO_ACCESS_TOKEN.
- **Updated:** 2026-05-23

## [TASK-007] Expo mobile UI
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Depends on:** TASK-005, TASK-006
- **Scope:** apps/mobile
- **Description:** Expo SDK 55: 4 tabs (Home, More, Spots, Futures), stack screens `/results`, `/rate-review`, SignalCard (OPEN/ACTIVE), ClosedSignalCard, WebSocket hook, expo-notifications, dark theme.
- **Acceptance criteria:**
  - [x] Все экраны wired к REST API
  - [x] `useSignalRealtime` invalidate TanStack Query cache
  - [x] Device token registration через REST
  - [x] Results: market toggle + timeframe pills + SummaryStatsCard
- **Notes:** apps/mobile с Expo Router, TanStack Query, dark theme.
- **Updated:** 2026-05-23

## [TASK-008] Next.js admin scaffold
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Depends on:** TASK-002
- **Scope:** apps/admin
- **Description:** Next.js 16.2.6: auth (login/refresh/logout/me), Signals CRUD, dashboard, JWT в memory + httpOnly refresh cookie.
- **Acceptance criteria:**
  - [x] Login/logout с JWT refresh
  - [x] CRUD signals с валидацией closeDate, liquidated, TP/SL
  - [x] TanStack Query + shared types
- **Notes:** `--webpack` для dev/build из-за Cyrillic path.
- **Updated:** 2026-05-23

## [TASK-009] Admin remaining CRUD pages
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Depends on:** TASK-008
- **Scope:** apps/admin
- **Description:** menu-links, results-summary, home-content, reviews moderation, settings (disclaimer, fab), notification templates + log.
- **Acceptance criteria:**
  - [x] Все admin endpoints из rest-api.md покрыты UI
  - [x] Forms с React Hook Form + Zod
- **Notes:** Все admin pages реализованы.
- **Updated:** 2026-05-23

## [TASK-010] Railway deploy
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Depends on:** TASK-007, TASK-009
- **Scope:** apps/api, apps/admin, docs/runbooks
- **Description:** Deploy api + admin на Railway, PostgreSQL 18 + Redis 7 plugins, prod env, CORS cross-origin auth.
- **Acceptance criteria:**
  - [x] `docs/runbooks/deploy-railway.md` с инструкциями deploy
  - [x] CORS + refresh cookie настроены в API
  - [x] Mobile env примеры для prod API/WS
- **Notes:** Runbook готов; prod deploy выполняется вручную по runbook.
- **Updated:** 2026-05-23

## [TASK-011] Documentation and contracts
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Scope:** docs/, AGENTS.md
- **Description:** docs/: architecture, getting-started, contracts/ (REST, WS, push, shared-types, prisma), apps/, runbooks/.
- **Acceptance criteria:**
  - [x] docs/README.md с оглавлением
  - [x] contracts синхронизированы с packages/shared и schema.prisma
  - [x] runbooks для deploy, menu link, signal event, troubleshooting
- **Notes:** Создано в рамках agent tooling sprint.
- **Updated:** 2026-05-23

## [TASK-012] Agent rules and task tracker
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Scope:** AGENTS.md, tasks.md, .cursor/rules/
- **Description:** AGENTS.md entry point, tasks.md backlog TASK-001..012, 7 .mdc rule files.
- **Acceptance criteria:**
  - [x] AGENTS.md в корне
  - [x] tasks.md с initial backlog
  - [x] .cursor/rules/: qpulse-core, contracts, nestjs-api, expo-mobile, nextjs-admin, shared-package, tasks-workflow
- **Notes:** —
- **Updated:** 2026-05-23

## Task ID counter

Next ID: **TASK-014**
