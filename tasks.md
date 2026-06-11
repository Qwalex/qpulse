# QPulse Tasks

> Agents: read [AGENTS.md](AGENTS.md) first. Update this file on every task state change.

## Active (in_progress)

_(пусто)_

## Backlog (pending)

_(пусто)_

## Blocked

_(пусто)_

## Done (recent)

## [TASK-025] More: notifications toggle + weekly prompt
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** apps/mobile (more.tsx, pushRegistration, notificationPreferences, modal)
- **Description:** Переключатель уведомлений на More; при выключении — unregister push; модалка раз в 7 дней с предложением включить.
- **Acceptance criteria:**
  - [x] Toggle Notifications на More
  - [x] Выключение → unregister + без регистрации при старте
  - [x] Модалка не чаще 1 раза в неделю
  - [x] typecheck
- **Updated:** 2026-06-11

## [TASK-024] Fix push token registration (DeviceToken empty)
- **Status:** done
- **Assignee:** agent
- **Priority:** P0
- **Scope:** apps/mobile/lib/pushRegistration.ts, apps/mobile/app/_layout.tsx
- **Description:** Регистрация Expo push token падала тихо: без `projectId`, ошибки `.catch(() => undefined)`.
- **Acceptance criteria:**
  - [x] `getExpoPushTokenAsync({ projectId })` из app.json / EAS config
  - [x] Ошибки в client-errors + console в dev
  - [x] Android channels signals_* + price_alerts
  - [x] Retry при возврате в foreground
- **Notes:** Нужен новый EAS preview APK + разрешение уведомлений на устройстве; FCM V1 в expo.dev project qpulse.
- **Updated:** 2026-06-11

## [TASK-023] Coin price tracking (Watch tab)
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** packages/shared, apps/api/price-watch, apps/mobile, docs/contracts, AGENTS.md
- **Description:** Watchlist до 10 монет, price alerts с push, вкладка Watch, виджет Home, Track entry на сигналах, Bybit WS feed.
- **Acceptance criteria:**
  - [x] Prisma + REST /price-watch + Bybit feed
  - [x] WS price:ticker на prices:device:{deviceId}
  - [x] Device-scoped price alert push
  - [x] Mobile Watch tab + TrackedCoinsWidget + SignalCard Track entry
  - [x] Contracts + typecheck
- **Notes:** CMC/CG не подходят для free realtime WS; используется Bybit public v5.
- **Updated:** 2026-06-11

## [TASK-022] Home: profit emulation under Signal Results
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** packages/shared, apps/mobile
- **Description:** Блок Profit Emulation под Signal Results: ввод capital, прогноз week/month/year от weighted total profit за 3M.
- **Acceptance criteria:**
  - [x] Ввод capital USD, расчёт week/month/year
  - [x] Weighted total profit Futures+Spot (3M)
  - [x] Скрыт если нет closed results
  - [x] typecheck OK
- **Notes:** `profit-emulation.util.ts`, `ProfitEmulationCard.tsx` на Home.
- **Updated:** 2026-06-11

## [TASK-021] Mobile UI fixes: Results theme, live metrics, Home results, Spot BUY
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** packages/shared, apps/api/market-metrics, apps/mobile, docs/contracts, AGENTS.md
- **Description:** Light theme на Results; live market metrics через API proxy; Home Signal Results futures→spot; BUY зелёный на Spots; default Futures; EAS APK + qnotify.
- **Acceptance criteria:**
  - [x] ResultsMarketToggle, TimeframePills, SummaryStatsCard theme-aware
  - [x] Default Results market = Futures
  - [x] GET /market-metrics с Redis cache (CoinGecko + Alternative.me)
  - [x] Home: market metrics из /market-metrics; Signal Results futures→spot, hide empty
  - [x] SignalCard: BUY/SELL color when direction null
  - [x] typecheck OK; preview APK + qnotify
- **Notes:** Altcoin Season — proxy через top-100 CoinGecko 30d vs BTC (CMC trial API недоступен). Admin lint pre-existing fail.
- **Updated:** 2026-06-11

## [TASK-020] Mobile dashboard: market metrics + results summary
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** packages/shared, apps/api/prisma, apps/api/home-content, apps/admin/home-content, apps/mobile dashboard
- **Description:** Убрать Ticker; показать market cap, Altcoin Season, Fear & Greed, краткую сводку Results. Данные из PostgreSQL/admin (не внешние API).
- **Acceptance criteria:**
  - [x] Ticker удалён с dashboard и из HomeContentDto/schema
  - [x] Market cap + Altcoin Season + Fear & Greed в card UI (light/dark)
  - [x] Краткая сводка Results + кнопка Results
  - [x] Admin редактирует новые поля; seed с demo-значениями
  - [x] Контракты обновлены; typecheck mobile OK
- **Notes:** Пользователь просил public API — по правилам Phase 1 данные admin-managed через HomeContent. Миграция `20260527120000_home_content_market_metrics`. Новые компоненты: MarketMetricsSection, DashboardResultsSummary.
- **Updated:** 2026-05-27

## [TASK-019] Mobile: hide tab screen headers
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** apps/mobile/app/(tabs)/_layout.tsx
- **Description:** Скрыть верхние заголовки Home, Spots, Futures, More — активная вкладка в bottom bar достаточна.
- **Acceptance criteria:**
  - [x] headerShown: false для tab screens
  - [x] Stack headers (Results, Rate app) не затронуты
  - [x] typecheck mobile OK
- **Notes:** `headerShown: false` в Tabs screenOptions; убраны неиспользуемые headerStyle/headerTintColor. Stack в app/_layout.tsx без изменений.
- **Updated:** 2026-05-27

## [TASK-017] Translate user-facing Russian UI to English
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** apps/mobile, apps/admin, docs/contracts (UI copy refs)
- **Acceptance criteria:**
  - [x] All user-facing Cyrillic strings in apps translated to English
  - [x] Date locale en-US where applicable
  - [x] lint/typecheck mobile + admin OK
  - [x] Grep confirms no remaining Cyrillic in UI files
- **Notes:** Translated mobile (Results, review flow, stats, errors, empty states), admin signal-form TP/SL labels, date locale en-US; updated rest-api.md + shared-types.md UI refs.
- **Updated:** 2026-05-27

## [TASK-018] Mobile: risk warning только на dashboard
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** apps/mobile (RiskBanner, more/spots/futures tabs)
- **Description:** Текст предупреждения о рисках показывать только на dashboard (home tab).
- **Acceptance criteria:**
  - [x] RiskBanner только на `(tabs)/index.tsx`
  - [x] Убран с More, Spots, Futures
  - [x] Стилизация light/dark на dashboard OK
  - [x] typecheck mobile OK
- **Notes:** RiskBanner переведён на `useAppStore().colors`; settingsQuery убран из More.
- **Updated:** 2026-05-27

## [TASK-016] Mobile: light theme styling fixes
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** apps/mobile (theme tokens, SignalCard, SettingsMenuList, ClosedSignalCard, home Results button)
- **Description:** Карточки, ссылки в More и кнопка «Результаты» используют dark-only цвета в light theme.
- **Acceptance criteria:**
  - [x] Signal cards используют themeColors из store
  - [x] SettingsMenuList (More) использует themeColors
  - [x] Кнопка «Результаты» на dashboard — корректный контраст
  - [x] lint/typecheck mobile OK
- **Notes:** Добавлен `textOnAccent`; SignalCard, ClosedSignalCard, SettingsMenuList переведены на `useAppStore().colors`.
- **Updated:** 2026-05-27

## [TASK-015] Отзыв: сохранение на устройстве и редактирование
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** packages/shared, apps/api, apps/mobile, docs/contracts, prisma migration
- **Description:** После отправки отзыва пункт меню меняется; AsyncStorage + GET /reviews/mine; upsert по deviceId.
- **Acceptance criteria:**
  - [x] GET /reviews/mine + upsert POST по deviceId
  - [x] Mobile: локальное состояние, «Изменить отзыв», экран редактирования
  - [x] Контракты обновлены
- **Notes:** Миграция `20260526120000_review_device_unique`.
- **Updated:** 2026-05-26

## [TASK-014] Контроль достижения TP / SL
- **Status:** done
- **Assignee:** agent
- **Priority:** P1
- **Scope:** packages/shared, apps/api, apps/admin, apps/mobile, docs/contracts
- **Description:** У каждого target и stop loss признак «достигнут»; админка и mobile отображают состояние.
- **Acceptance criteria:**
  - [x] `SignalTarget.hit` в shared + контрактах
  - [x] Админка: UI для targets/SL с чекбоксами hit
  - [x] API синхронизирует currentTpLevel/targetHitLabel; TP_HIT при новом hit
  - [x] Mobile показывает достигнутые/не достигнутые TP и SL
- **Notes:** `slHit` для SL; `hit` на каждом target в details.
- **Updated:** 2026-05-26

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

Next ID: **TASK-022**
