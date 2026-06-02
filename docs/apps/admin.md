# Admin App (Next.js)

`apps/admin` — Next.js 16.2.6 admin panel for CRUD operations. Single admin, no RBAC.

## Stack

| Package | Purpose |
|---------|---------|
| Next.js 16 | App Router |
| React 19 | UI |
| Tailwind CSS v4 | Styling (dark UI) |
| @tanstack/react-query | Server state |
| react-hook-form + zod | Forms |
| @qpulse/shared | DTOs, enums |

## Routes

| Route | Function |
|-------|----------|
| `/login` | Email + password |
| `/dashboard` | Counts: live, closed, cancelled, reviews, recent push |
| `/signals` | Signal list with filters |
| `/signals/new` | Create signal form |
| `/signals/[id]/edit` | Edit signal (all execution fields) |
| `/results-summary` | CRUD stats per marketType + timeframe |
| `/menu-links` | Settings menu editor |
| `/reviews` | Review moderation (list + delete) |
| `/home-content` | Market metrics, fear&greed, socialLinks |
| `/settings` | Disclaimer, telegramFabUrl |
| `/notifications` | Push templates + delivery log |

## Auth flow

1. `POST /admin/auth/login` → `{ accessToken, user }` + httpOnly refresh cookie
2. Access token stored in **React memory** (not localStorage)
3. Admin API calls: `Authorization: Bearer <token>`
4. Token refresh: `POST /admin/auth/refresh` with credentials
5. Logout: `POST /admin/auth/logout`

### Cross-origin (Railway)

Admin and API on different domains. API CORS:

```typescript
origin: [process.env.ADMIN_URL],
credentials: true,
```

Refresh cookie: `httpOnly`, `Secure`, `SameSite=Lax` on admin origin.

Production: auth requests go through same-origin proxy `src/app/api/v1/admin/auth/[...path]/route.ts` (cookie first-party; upstream API still validates).

## lib/api.ts

- Base URL: `NEXT_PUBLIC_API_URL`
- Attaches JWT from auth context
- `credentials: 'include'` for refresh endpoints

## Signal form fields

Unified form for create/edit:

| Field | Notes |
|-------|-------|
| pair, marketType | Required |
| direction / action | Futures: direction; Spot: action |
| entryPrice, capitalPercentage | Required |
| leverage | Futures optional |
| openDate | Required |
| closeDate | Required when status=CLOSED |
| status | OPEN \| ACTIVE \| CLOSED \| CANCELLED |
| currentTpLevel | 1-4 |
| slHit, liquidated | Mutually exclusive semantics |
| profitPercentage, targetHitLabel | |
| details.targets[], details.stopLoss | JSON structure |

**Validation (Zod):**
- `closeDate` required when `CLOSED`
- `liquidated` only when `CLOSED`

## Results

Read-only view of `GET /results`: filters (market, timeframe), computed summary cards, table of CLOSED signals. Row/batch delete removes signals (same as `/signals`).

## Env

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Dev server: port **3000**.

## Commands

```bash
pnpm --filter admin dev
pnpm --filter admin build
pnpm --filter admin typecheck
pnpm --filter admin lint
```

## Acceptance criteria

1. Login/logout with JWT refresh
2. Full signals CRUD with validation
3. All admin endpoints from rest-api.md have UI
4. Shared types from `@qpulse/shared`
5. Toast feedback on success/error

## Conventions

- Use shared DTOs for form defaults and API payloads
- Optimistic updates via TanStack Query where safe
- Desktop-first responsive layout
