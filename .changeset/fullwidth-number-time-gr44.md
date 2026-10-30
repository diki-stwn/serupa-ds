---
"serupa-ds": patch
---

- Fixed: NumberInput and TimePicker read what a Japanese or Chinese IME types in full-width mode. "１４：０５" and "午後２：０５" were refused as times. "１，５００．５" was not read as a number, and "－５" became 5, losing its minus sign. Typed text is now normalized (NFKC) first, so it reads the same as half width (GR44).
