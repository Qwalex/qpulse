# Интеграция signalsBot (bb-trader)

Внешний торговый монорепо, который поставляет сигналы в QPulse через **Integrations API** (не admin JWT).

## Репозиторий партнёра

| | |
|--|--|
| Локальный путь | `c:\Users\qwazi\Projects\signalsBotProd` |
| Стек | NestJS API + Next.js web, npm, PostgreSQL |
| Документация для агентов | `docs/qpulse-ecosystem.md` (в signalsBot) |

## Аутентификация

```http
X-API-Key: <INTEGRATIONS_API_KEY>
```

На QPulse API (`apps/api`): env `INTEGRATIONS_API_KEY`.  
В signalsBot (per cabinet, UI `/my-group`): `QPULSE_API_KEY` — **тот же секрет**.

## Endpoints (реализованы в `apps/api/src/integrations/`)

| Method | Path | Поведение |
|--------|------|-----------|
| POST | `/api/v1/integrations/signals` | Upsert по `externalId` (= `signal.id` signalsBot) |
| PATCH | `/api/v1/integrations/signals/:externalId` | Lifecycle + PnL fields |

Контракт тела: `docs/contracts/rest-api.md` (§ Integrations).

Throttle: 60 req/min per key (`IntegrationsApiKeyGuard`).

## Поток данных

1. signalsBot userbot ingest → parse → Bybit placement (только после успеха).
2. Mirror в Telegram publish-группы.
3. Если `linkedToApp` на группе и `publishEveryN` → POST в QPulse.
4. TP / close / SL → PATCH, если есть запись sync в signalsBot (`SignalExternalSync`).

Сигналы, созданные вручную в QPulse Admin, **не** связаны с signalsBot (`externalId` пустой).

## Статусы

| signalsBot status | QPulse SignalStatus |
|-------------------|---------------------|
| PENDING, PARSED, ORDERS_PLACED (no entry fill) | OPEN |
| spot OPEN, futures with filled entry | ACTIVE |
| CLOSED_WIN, CLOSED_LOSS, CLOSED_MIXED, liquidation | CLOSED |
| FAILED, CANCELLED_BY_CHAT, … | CANCELLED |

Mapper: signalsBot `qpulse-signal-mapper.util.ts`.

## PnL / Results

- `positionSizeUsdt`, `realizedPnlUsdt`, `profitPercentage` на модели `Signal`.
- `GET /results` summary считается из CLOSED (миграция `20260531140000_*`).
- Формула profit %: `packages/shared/src/signal-profit.util.ts` (согласована с signalsBot mapper).

## Coordinated deploy

При изменении контракта или PnL-полей:

1. Deploy **qpulse-api** (migrate).
2. Deploy **qpulse-admin**.
3. Deploy **signalsBot API** (ветка `cabinets` на Railway).

См. `docs/runbooks/deploy-railway.md` § Coordinated deploy.

## Admin QPulse vs integration

| Доступ | Назначение |
|--------|------------|
| Admin login (`admin@qpulse.app` / seed) | CRUD в веб-админке, JWT |
| `INTEGRATIONS_API_KEY` | Автоматический sync из signalsBot |

Не подставлять admin JWT вместо `X-API-Key` в signalsBot.
