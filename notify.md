# Как отправлять qnotify ?

```js
fetch('https://notify.qwalex.one/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'YOUR_TEXT_HERE' })
});
```
