# Deploy on Railway

Пошаговая настройка QPulse API + Admin на Railway (monorepo).

## Архитектура

| Railway service | Dockerfile | Health check |
|-----------------|------------|--------------|
| `qpulse-api` | `apps/api/Dockerfile` | `GET /health` |
| `qpulse-admin` | `apps/admin/Dockerfile` | `GET /login` |
| PostgreSQL | Plugin | — |
| Redis | Plugin | — |

**Важно:** Root Directory обоих сервисов = **корень репозитория** (`/`), не `apps/api`.

---

## Шаг 1. Создать проект и плагины

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. **Add Plugin** → **PostgreSQL**
3. **Add Plugin** → **Redis**

---

## Шаг 2. Сервис API (`qpulse-api`)

### Settings → General

| Поле | Значение |
|------|----------|
| Root Directory | `/` (пусто / repo root) |
| Config file path | `apps/api/railway.toml` |

### Settings → Build

- Builder: **Dockerfile**
- Dockerfile path: `apps/api/Dockerfile`

### Settings → Variables

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<openssl rand -hex 32>
ADMIN_URL=https://<admin-domain>.up.railway.app
NODE_ENV=production
EXPO_ACCESS_TOKEN=<optional>
RUN_SEED=true
```

> `RUN_SEED=true` — **только первый деплой** (создаёт admin@qpulse.app / admin123). После успешного seed удалите переменную.

> `ADMIN_URL` — точный URL admin **без** trailing slash. Сначала можно задать placeholder, затем обновить после деплоя admin.

### Settings → Networking

- **Generate Domain** → например `qpulse-api-production.up.railway.app`
- WebSocket: `wss://<api-domain>/api/v1/realtime`

### Первый деплой

При старте контейнер автоматически выполняет `prisma migrate deploy` (см. `docker-entrypoint.sh`).

Проверка:

```bash
curl https://<api-domain>/health
# → {"status":"ok","timestamp":"..."}

curl https://<api-domain>/api/v1/home-content
# → 200
```

---

## Шаг 3. Сервис Admin (`qpulse-admin`)

### Settings → General

| Поле | Значение |
|------|----------|
| Root Directory | `/` |
| Config file path | `apps/admin/railway.toml` |

### Settings → Build

- Builder: **Dockerfile**
- Dockerfile path: `apps/admin/Dockerfile`

### Settings → Variables

```env
NEXT_PUBLIC_API_URL=https://<api-domain>/api/v1
NODE_ENV=production
```

> `NEXT_PUBLIC_API_URL` **встраивается при сборке**. После изменения — **Redeploy** admin.

Railway передаёт переменные в Docker build как `ARG NEXT_PUBLIC_API_URL`.

### Settings → Networking

- **Generate Domain** → например `qpulse-admin-production.up.railway.app`

### Обновить API

Вернитесь в сервис **API** и установите:

```env
ADMIN_URL=https://<admin-domain>.up.railway.app
```

Redeploy API (для CORS).

---

## Шаг 4. Проверка auth (CORS + cookies)

1. Откройте `https://<admin-domain>/login`
2. Войдите: `admin@qpulse.app` / `admin123`
3. Смените пароль (backlog: UI смены пароля — пока через Prisma/seed)
4. Обновите страницу — refresh cookie должен работать

Cookie settings (уже в коде):

- `httpOnly: true`
- `secure: true` (production)
- `sameSite: 'none'` (production, cross-origin)
- `path: '/api/v1/admin/auth'`

API использует `trust proxy` и слушает `0.0.0.0` — требуется для Railway.

---

## Шаг 5. Mobile (EAS)

```env
EXPO_PUBLIC_API_URL=https://<api-domain>
EXPO_PUBLIC_WS_URL=wss://<api-domain>
```

Пересоберите приложение после стабилизации доменов.

---

## Локальная проверка Docker-образов

```bash
# API
docker build -f apps/api/Dockerfile -t qpulse-api .
docker run --rm -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=test \
  -e ADMIN_URL=http://localhost:3000 \
  qpulse-api

# Admin
docker build -f apps/admin/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 \
  -t qpulse-admin .
docker run --rm -p 3000:3000 qpulse-admin
```

---

## Post-deploy checklist

- [ ] `GET /health` → 200
- [ ] `RUN_SEED` удалён после первого деплоя
- [ ] `JWT_SECRET` — случайная строка (не dev default)
- [ ] `ADMIN_URL` на API совпадает с доменом admin
- [ ] Admin login + refresh работают
- [ ] CRUD signal → WS update (mobile dev client)
- [ ] Push с `EXPO_ACCESS_TOKEN` (optional)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Admin login 401 on refresh | `ADMIN_URL` на API = точный URL admin; admin auth через same-origin proxy `/api/v1/admin/auth/*` |
| Refresh 500 без cookie | Перелогиниться; API возвращает 401 если cookie нет (не 500) |
| CORS error | API `ADMIN_URL` без `/` в конце; redeploy API |
| Build admin с localhost API | Задать `NEXT_PUBLIC_API_URL` **до** build, redeploy |
| `prisma migrate` failed | Проверить `DATABASE_URL` (internal URL Railway Postgres) |
| WS not connecting | `wss://` + тот же домен что API |
| Health check failed | Подождать 60s (start-period); проверить Postgres + Redis |
| `prisma: not found` при старте | В `apps/api/Dockerfile` копируется `apps/api/node_modules`; entrypoint — `sh docker-entrypoint.sh` (CRLF strip в образе) |

See also: [local-dev-troubleshooting.md](local-dev-troubleshooting.md)
