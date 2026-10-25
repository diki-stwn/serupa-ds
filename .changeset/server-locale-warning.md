---
"serupa-ds": patch
---

- Added: a warning, once on the server, when a component that writes dates, times or numbers renders without a locale from its prop or a `SerupaProvider`: its HTML is en-US and changes to the browser's locale after hydration.
