---
"serupa-ds": patch
---

- Fixed: DatePicker and DateRangePicker didn't read digits typed without separators, though their fields open a number keypad on phones, where separators are hard to type. Now 6 or 8 digits are read in the locale's order (`11222001` or `112201` in en-US, `22112001` in de-DE), or as ISO `20011122`. When both readings make a date, the one nearer today wins.
