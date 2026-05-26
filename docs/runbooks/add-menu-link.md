# Runbook: Add Menu Link

Добавление новой кнопки в экран More («Setting and More») без изменения mobile-кода.

## Overview

Menu items хранятся в таблице `MenuLink`. Mobile рендерит `GET /settings/menu` динамически через `SettingsMenuList`.

## Option A: Admin UI (preferred)

1. Login to admin → `/menu-links`
2. Click **Add link**
3. Fill form:

| Field | Example |
|-------|---------|
| id | `follow_instagram` |
| label | Follow On Instagram |
| icon | `instagram` |
| actionType | `EXTERNAL_LINK` or `INTERNAL_ROUTE` |
| url | `https://instagram.com/yourpage` (external) |
| route | `/results` (internal) |
| order | `6` |
| isEnabled | `true` |

4. Save → mobile picks up on next `GET /settings/menu` (or pull-to-refresh if implemented)

## Option B: Admin API

```bash
curl -X POST https://api.example.com/api/v1/admin/menu-links \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "follow_instagram",
    "label": "Follow On Instagram",
    "icon": "instagram",
    "actionType": "EXTERNAL_LINK",
    "url": "https://instagram.com/yourpage",
    "order": 6,
    "isEnabled": true
  }'
```

## Option C: Seed / Prisma (dev only)

Add row to `apps/api/prisma/seed.ts` MenuLink section, then:

```bash
pnpm --filter api prisma db seed
```

## actionType behavior (mobile)

| actionType | Mobile action |
|------------|---------------|
| `EXTERNAL_LINK` | `Linking.openURL(url)` |
| `INTERNAL_ROUTE` | `router.push(route)` |

## Icon names

Mobile `SettingsMenuItem` maps icon string to component. Supported icons should be documented in mobile component. Unknown icons → fallback generic icon.

To add new icon: update `SettingsMenuItem` icon map in `apps/mobile` (one-time code change).

## Enable/disable without delete

```bash
PATCH /admin/menu-links/follow_instagram
{ "isEnabled": false }
```

Instagram in seed defaults to `isEnabled: false`.

## Checklist

- [ ] Unique `id` (snake_case)
- [ ] `order` doesn't conflict (gaps OK)
- [ ] EXTERNAL_LINK has `url`; INTERNAL_ROUTE has `route`
- [ ] Test on device: More screen shows new item
- [ ] Tap opens correct URL or navigates to route

## Related docs

- [shared-types.md](../contracts/shared-types.md) — MenuLinkDto
- [prisma-schema.md](../contracts/prisma-schema.md) — MenuLink model
- [mobile.md](../apps/mobile.md) — SettingsMenuList
