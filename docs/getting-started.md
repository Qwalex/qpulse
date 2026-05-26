# Getting Started

Локальная разработка QPulse monorepo.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 24.16.0 LTS (см. `.nvmrc`) |
| pnpm | 9.15.0 |
| Docker | для PostgreSQL 18 + Redis 7 |
| Expo CLI | через `npx expo` (mobile) |

> Node 20 вышел из LTS — не использовать. Node 26 — Current, не для production.

## Quick start

```bash
# 1. Node version
nvm use   # или fnm use

# 2. Dependencies
pnpm install

# 3. Infrastructure
docker compose up -d

# 4. Database
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed

# 5. Dev (api + admin + mobile via turbo)
pnpm dev
```

## Services (local)

| Service | URL | Port |
|---------|-----|------|
| API | http://localhost:3001 | 3001 |
| Swagger | http://localhost:3001/api/docs | 3001 |
| WebSocket | ws://localhost:3001/api/v1/realtime | 3001 |
| Admin | http://localhost:3000 | 3000 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |

## Environment variables

### API (`apps/api/.env`)

Скопируй из `apps/api/.env.example`:

```env
DATABASE_URL=postgresql://qpulse:qpulse@localhost:5432/qpulse
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-prod
ADMIN_URL=http://localhost:3000
EXPO_ACCESS_TOKEN=          # optional для реальной отправки push
PORT=3001
```

### Admin (`apps/admin/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Mobile (`apps/mobile/.env`)

```env
# Base URL without /api/v1 (app adds the prefix automatically)
EXPO_PUBLIC_API_URL=http://localhost:3001

# Optional dedicated WebSocket base URL
# EXPO_PUBLIC_WS_URL=ws://localhost:3001

# Android emulator
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
# EXPO_PUBLIC_WS_URL=ws://10.0.2.2:3001
```

## Seed admin user

После `prisma db seed` используй credentials из `apps/api/prisma/seed.ts` (обычно `admin@qpulse.local`).

## Useful commands

```bash
# Только API
pnpm --filter api dev

# Только admin
pnpm --filter admin dev

# Только mobile
pnpm --filter mobile start

# Lint + typecheck (весь monorepo)
pnpm lint
pnpm typecheck

# Prisma Studio
pnpm --filter api prisma studio
```

## Project layout

- `apps/api` — NestJS backend
- `apps/admin` — Next.js admin panel
- `apps/mobile` — Expo mobile app
- `packages/shared` — shared TypeScript types
- `docs/` — architecture, contracts, runbooks

## Next steps

- [Architecture](architecture.md)
- [REST API contracts](contracts/rest-api.md)
- [Local dev troubleshooting](runbooks/local-dev-troubleshooting.md)
