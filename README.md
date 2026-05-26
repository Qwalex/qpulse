# QPulse

Crypto signals app: Expo mobile + NestJS API + Next.js admin.

## Stack

- **Mobile:** Expo SDK 55, expo-router, TanStack Query
- **API:** NestJS 11, Prisma, PostgreSQL 18, Redis, BullMQ, WebSocket
- **Admin:** Next.js 16, TanStack Query
- **Shared:** `@qpulse/shared` — types and enums

## Quick start

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm --filter @qpulse/shared build
cd apps/api && pnpm exec prisma migrate dev && pnpm exec prisma db seed
pnpm dev
```

**Admin login:** `admin@qpulse.app` / `admin123`

## URLs

| App | URL |
|-----|-----|
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/api/docs |
| Admin | http://localhost:3000 |
| Mobile | Expo dev server |

## Deploy (Railway)

Подробная инструкция: [docs/runbooks/deploy-railway.md](docs/runbooks/deploy-railway.md)

Кратко:

1. PostgreSQL + Redis plugins
2. **API** service: Root `/`, config `apps/api/railway.toml`, env `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ADMIN_URL`
3. **Admin** service: Root `/`, config `apps/admin/railway.toml`, env `NEXT_PUBLIC_API_URL=https://<api>/api/v1`
4. Обновить `ADMIN_URL` на API после получения домена admin

## Mobile (EAS Build)

```bash
cd apps/mobile
pnpm generate-assets   # first time / refresh placeholders
eas build --platform android --profile production
```

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` in EAS env. Replace `extra.eas.projectId` in `app.json` after `eas init`.

## Docs

See [docs/README.md](docs/README.md), [AGENTS.md](AGENTS.md), [tasks.md](tasks.md).
