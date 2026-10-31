---
"serupa-ds": patch
---

- Fixed: TimePicker reads a `value`, `defaultValue`, `min` or `max` with seconds ("09:30:00", as a database's time column and `<input type="time">` can give it) instead of showing nothing, and a typed or pasted "14:05:30" reads as 14:05 (L8E9).
