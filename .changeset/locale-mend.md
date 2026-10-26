---
"serupa-ds": patch
---

- Fixed: A malformed locale no longer unmounts the page. Intl throws on a tag like `en_US` (common from a server's `LANG` or Java), so `<SerupaProvider locale="en_US">` broke every component that writes a date, number or relative time. Underscores are now read as hyphens, and a tag Intl can't read at all is skipped for the provider's or the browser's locale, with a `bad-locale` warning in development. `formatNumber`, `relativeTime` and `useLocale` mend the locale the same way.
