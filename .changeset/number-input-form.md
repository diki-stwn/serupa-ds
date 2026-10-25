---
"serupa-ds": patch
---

- Fixed: NumberInput submitted the text it shows ("Rp 1.500.000", "1.234,5"), which a server can't read as a number. With `name`, it now submits the number from a hidden input (whole cents with `minorUnits`), and `form` reaches it too (P1, U3).
- Fixed: a form reset left NumberInput showing and sending the old number. It puts `defaultValue` back now (P2).
