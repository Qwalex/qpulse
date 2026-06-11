# Mobile App (Expo)

`apps/mobile` — Expo SDK 55, expo-router, dark-first UI.

## Stack

| Package | Purpose |
|---------|---------|
| expo ~55 | Runtime |
| expo-router ~55 | File-based routing |
| @tanstack/react-query | Data fetching + cache invalidation |
| zustand | Theme/settings local state |
| expo-notifications | Push registration + tap handling |
| expo-linking | External TG links from menu |
| @qpulse/shared | DTOs, WS types |

## Navigation

### Tabs (`(tabs)/`)

| Tab | Route | Screen |
|-----|-------|--------|
| Home | `index` | Market metrics, Fear & Greed, results summary, social links |
| More | `more` | Settings menu, notifications + types, dark mode toggle |
| Spots | `spots` | Live SPOT signals (OPEN + ACTIVE) |
| Futures | `futures` | Live FUTURES signals |

### Stack screens

| Route | Purpose |
|-------|---------|
| `/results` | Past results (closed signals + summary) |
| `/rate-review` | Star rating + comment |

## Data sources

| Screen | API |
|--------|-----|
| Home | `GET /home-content` |
| Spots/Futures | `GET /signals?marketType=spot\|futures&status=live` + WS |
| More | `GET /settings/menu` + local dark mode |
| Results | `GET /results?marketType=...&timeframe=...` |
| Rate and Review | `POST /reviews` |
| Risk banner | `GET /settings` → disclaimer |
| Telegram FAB | `GET /settings` → telegramFabUrl |

## Key components

| Component | Used on | Notes |
|-----------|---------|-------|
| `SignalCard` | Spots, Futures | OPEN/ACTIVE, expand targets + stoploss |
| `ClosedSignalCard` | Results only | Collapsed min / expanded full |
| `SummaryStatsCard` | Results | From `response.summary` |
| `ResultsMarketToggle` | Results | spot ↔ futures |
| `TimeframePills` | Results | 1W–1Y, default 3M |
| `RiskBanner` | Spots, Futures | Red border disclaimer |
| `TelegramFab` | Spots, Futures | `Linking.openURL(telegramFabUrl)` |
| `SettingsMenuList` | More | Renders enabled MenuLinks by order |
| `NotificationPreferencesSection` | More | Granular push toggles when notifications enabled |
| `StarRating` | rate-review | 1–5 stars |

## Theme

Dark-first palette:

| Token | Color |
|-------|-------|
| background | `#0A0A0F` |
| card | `#1E1E24` |
| accent | `#3B82F6` |
| profit | `#22C55E` |
| loss / dates | `#EF4444` |
| capital | `#D97706` |

## lib/api.ts

Fetch wrapper using `EXPO_PUBLIC_API_URL`. All paths relative to `/api/v1`.

## useSignalRealtime hook

Location: `hooks/useSignalRealtime.ts`

1. Connect Socket.io to `EXPO_PUBLIC_WS_URL`
2. Subscribe: `signals:spot`, `signals:futures`, `signals:all`
3. On `signal:updated` / `signal:deleted` / `signal:event` → invalidate queries
4. Exponential reconnect (1s cap 30s)

## Push notifications

1. Request permissions on first launch
2. Get Expo push token
3. `POST /devices/register` with `{ pushToken, platform, deviceId }`
4. On notification tap → deep link to Spots/Futures by signal marketType (MVP)

## Menu links

**Do not hardcode menu items.** Render from `GET /settings/menu`:

- `EXTERNAL_LINK` → `Linking.openURL(url)`
- `INTERNAL_ROUTE` → `router.push(route)`
- Dark Mode → client-only AsyncStorage toggle

## Env

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api/v1
EXPO_PUBLIC_WS_URL=ws://10.0.2.2:3001/api/v1/realtime
```

## Build (Google Play)

EAS Build → AAB. FCM credentials for Android push. See backlog for full EAS config.

## Rules

- CANCELLED signals never shown
- Results uses `ClosedSignalCard` only (not `SignalCard`)
- No external market APIs
