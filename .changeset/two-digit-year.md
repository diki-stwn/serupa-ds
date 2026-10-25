---
"serupa-ds": patch
---

- Fixed: DatePicker and DateRangePicker read a typed two-digit year as 20xx, so a birth date typed as 1/2/85 became 2085. A one- or two-digit year is now the one within 50 years of today (in 2026, `85` is 1985 and `30` is 2030). A year typed with four digits, even 0085, stays as typed.
