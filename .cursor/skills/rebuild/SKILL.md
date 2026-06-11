---
name: rebuild
description: Rebuilds QPulse Android preview APK via EAS and sends the download link with qnotify. Use when the user says rebuild, /rebuild, пересобери apk, rebuild apk, or asks to rebuild the app and notify.
---

# rebuild (QPulse mobile APK)

End-to-end: **EAS preview APK** → wait for artifact → **qnotify** with links.

Read [qnotify SKILL](../qnotify/SKILL.md) for the notification step.

## Preconditions

- Working directory: `apps/mobile`
- Profile: **`preview`** (APK, production API URLs from `eas.json`)
- CLI: `npx eas-cli` (global `eas` may be missing)

Optional before build (if code changed):

```bash
pnpm --filter @qpulse/mobile typecheck
```

## Step 1 — Start build

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview --non-interactive
```

Capture **build ID** and **logs URL** from stdout (`expo.dev/.../builds/<id>`).

## Step 2 — Wait for FINISHED

Poll until `status` is `FINISHED` (or report failure):

```bash
BUILD_ID="<uuid-from-step-1>"
npx eas-cli build:view "$BUILD_ID" --json
```

Parse `status` and `artifacts.buildUrl` (APK direct link). Example poll loop:

```bash
cd apps/mobile
BUILD_ID="<uuid>"
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  JSON=$(npx eas-cli build:view "$BUILD_ID" --json 2>/dev/null)
  STATUS=$(node -e "const d=JSON.parse(process.argv[1]); console.log(d.status)" "$JSON")
  APK=$(node -e "const d=JSON.parse(process.argv[1]); console.log(d.artifacts?.buildUrl||'')" "$JSON")
  echo "poll $i: $STATUS ${APK:0:60}"
  [ "$STATUS" = "FINISHED" ] && break
  [ "$STATUS" = "ERRORED" ] || [ "$STATUS" = "CANCELED" ] && exit 1
  sleep 30
done
```

Build page URL pattern:

`https://expo.dev/accounts/qwazik/projects/qpulse/builds/<BUILD_ID>`

## Step 3 — qnotify (required)

Do **not** skip notify after a successful build. Use curl + safe JSON (see qnotify skill):

```bash
TEXT="QPulse APK rebuild ready.
Build: https://expo.dev/accounts/qwazik/projects/qpulse/builds/<BUILD_ID>
Download: <APK_URL>"

curl -sS -X POST 'https://notify.qwalex.one/' \
  -H 'Content-Type: application/json' \
  --data "$(node -e "console.log(JSON.stringify({text: process.argv[1]}))" "$TEXT")"
```

Message must include:

- Short summary (optional: branch or what changed)
- **Build page** URL
- **Direct APK** URL (`artifacts.buildUrl`)

On notify failure: tell the user; still return APK/build URLs in chat.

## On build failure

- Do not send qnotify claiming success
- Report `status`, build logs URL, and likely next step (fix typecheck, EAS credentials, network)

## Defaults

| Setting | Value |
|---------|--------|
| Platform | `android` |
| Profile | `preview` |
| Output | APK |
| API | `https://qpulse-api-production.up.railway.app` (from `eas.json` env) |

Use profile `production` only if the user explicitly asks for AAB / store build.

## Checklist

```
- [ ] eas-cli build started (preview / android)
- [ ] Build FINISHED; APK URL obtained
- [ ] qnotify sent with build + download links
- [ ] User informed in chat (URLs even if notify OK)
```
