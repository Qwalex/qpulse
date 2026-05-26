# Local Dev Troubleshooting

Common issues when running QPulse locally.

## Prerequisites check

```bash
node -v    # expect 24.x
pnpm -v    # expect 9.x
docker compose ps   # postgres + redis running
```

## Database

### `Can't reach database server`

```bash
docker compose up -d
docker compose logs postgres
```

Verify `DATABASE_URL` in `apps/api/.env`:

```
postgresql://qpulse:qpulse@localhost:5432/qpulse
```

### Migration errors

```bash
pnpm --filter api prisma migrate reset   # WARNING: wipes data
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed
```

### Seed fails (duplicate key)

Reset DB or fix seed idempotency. For dev:

```bash
pnpm --filter api prisma migrate reset --force
```

## Redis

### BullMQ / WS pub/sub errors

```bash
docker compose up -d redis
redis-cli ping   # PONG
```

Check `REDIS_URL=redis://localhost:6379` in api `.env`.

## API

### Port 3001 already in use

```bash
# Windows
netstat -ano | findstr :3001
# Kill process or change PORT in .env
```

### Swagger 404

Ensure API running. URL: http://localhost:3001/api/docs (not `/api/v1/docs`).

### CORS errors from admin

Set `ADMIN_URL=http://localhost:3000` in api `.env`. Restart API.

## Admin

### Login works but API calls 401

- Access token expired (15 min) — trigger refresh
- Check `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
- Verify Bearer header in network tab

### Refresh cookie not sent

- Use `credentials: 'include'` on fetch
- Dev: both on localhost (different ports OK with CORS credentials)

## Mobile (Expo)

### Cannot reach API from emulator

| Platform | API URL |
|----------|---------|
| Android emulator | `http://10.0.2.2:3001/api/v1` |
| iOS simulator | `http://localhost:3001/api/v1` |
| Physical device | `http://<your-lan-ip>:3001/api/v1` |

Firewall must allow inbound 3001.

### WebSocket not connecting

- Match `EXPO_PUBLIC_WS_URL` to API host (not `localhost` on Android emulator)
- Use `ws://` locally, `wss://` in prod

### Push not received locally

- `EXPO_ACCESS_TOKEN` optional — without it PushWorker logs `skipped`
- Physical device required for real push (not simulator)
- Verify `POST /devices/register` succeeded

## Monorepo

### `Cannot find module '@qpulse/shared'`

```bash
pnpm install
pnpm --filter @qpulse/shared build   # if build step exists
```

Ensure `packages/shared` listed in `pnpm-workspace.yaml`.

### Turbo cache issues

```bash
pnpm dev --force
# or
rm -rf node_modules .turbo && pnpm install
```

## Prisma client out of sync

```bash
pnpm --filter api prisma generate
```

After schema changes always run `migrate dev`.

## Typecheck failures

```bash
pnpm typecheck
```

Run from repo root. Fix package-specific errors:

```bash
pnpm --filter api typecheck
pnpm --filter admin typecheck
pnpm --filter mobile typecheck
```

## Still stuck?

1. Check `tasks.md` for known blockers
2. Read [getting-started.md](../getting-started.md)
3. Verify docker logs: `docker compose logs -f`
