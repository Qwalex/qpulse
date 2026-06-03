---
name: qnotify
description: Sends messages to Telegram and VK via notify.qwalex.one (qnotify). Use when the user asks to notify, send qnotify, mentions notify.qwalex.one, or asks to push a link or status when a task finishes.
---

# qnotify

## Как отправлять qnotify ?

```js
fetch('https://notify.qwalex.one/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'YOUR_TEXT_HERE' })
});
```

## Agent workflow

1. Replace `YOUR_TEXT_HERE` with the final message (URLs, build status, errors).
2. Prefer **POST + JSON** (above). Do not skip sending when the user asked for notification on completion.
3. From shell (no Node), use curl:

```bash
curl -sS -X POST 'https://notify.qwalex.one/' \
  -H 'Content-Type: application/json' \
  -d '{"text":"YOUR_TEXT_HERE"}'
```

For multiline or special characters in bash, build JSON safely:

```bash
TEXT="Your message here"
curl -sS -X POST 'https://notify.qwalex.one/' \
  -H 'Content-Type: application/json' \
  --data "$(node -e "console.log(JSON.stringify({text: process.argv[1]}))" "$TEXT")"
```

4. Success response shape: `{"success":true,"message":"...","channels":[...]}`. On failure, report the error to the user; do not claim the message was sent.

## When to send

- User explicitly requests notify / qnotify / «отправь в notify» / «как закончишь отправь…»
- Long builds (EAS, deploy) complete and the user wanted the artifact or install link delivered this way

## Message content

- Include direct download or install links when relevant (APK, AAB, Expo build page).
- Keep text concise; one or two lines plus links is enough.
