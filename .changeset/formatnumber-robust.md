---
"serupa-ds": patch
---

- Fixed: FormattedNumber and `formatNumber` no longer throw on options Intl rejects (a currency like "US", a unit like "km/h", or minimumFractionDigits above maximumFractionDigits), which unmounted the page. They write the plain number, with a `number-options` warning in development.
- Fixed: `bytes` sizes that round up to 1024 take the next unit: 1,048,575 is "1 MB", not "1,024 kB", and 1023.9 is "1 kB". Fractional bytes round to whole ones.
- Changed: Each locale and set of options builds its Intl.NumberFormat once, so a table of 1,000 numbers re-renders in a fraction of the time.
