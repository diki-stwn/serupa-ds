---
"serupa-ds": patch
---

Fixed: components that follow the browser's locale (no `locale` prop or SerupaProvider locale) built a new `Intl.DateTimeFormat` to ask for it at least twice on every render, which made a 1,000-row Table take 2.4 s to tick one row on a slow phone. The locale is now read once and read again when the browser fires `languagechange`.
