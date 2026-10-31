---
"serupa-ds": patch
---

NumberInput: a `value` or `defaultValue` with more decimals than the format shows (19.995 USD shown as US$20.00, 1250000000.5 IDR as Rp 1.250.000.001) is now taken as shown. The form sends what people see, and focusing the field and leaving it without an edit no longer changes the value or calls `onValueChange`.
