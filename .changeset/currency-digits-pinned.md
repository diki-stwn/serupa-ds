---
"serupa-ds": patch
---

Fixed: FormattedNumber and NumberInput write a currency with the same decimals in every browser. Safari and Firefox ship older CLDR data than Node and Chromium, so "Rp 150.000" from the server became "Rp 150.000,00" in the browser and failed hydration. The decimals now come from a table, unless your options set the rounding.
