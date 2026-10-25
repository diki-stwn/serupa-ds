---
"serupa-ds": patch
---

- Fixed: `dist/theme.js` works pasted into an inline `<script>` in `<head>`, the usual way a server-rendered page avoids a flash of the wrong theme. Its usage comment held a closing script tag, which ended an inline script there, so the browser threw "Invalid or unexpected token" and no theme was set. Loading it with `src` always worked. The README says how to inline it (with a nonce under a strict Content Security Policy).
- Fixed: `dist/serupa-icons.iife.js`'s first line says the file is empty since 6.1 and can be removed from the page, instead of "every Material Symbol by name".
