---
"serupa-ds": patch
---

- Fixed: Calendar's arrow keys, Home, End, PageUp and PageDown stop at `min` and `max`, as the native date field does. A Shift+PageUp could leave focus on a day a year outside the range, in a month the buttons wouldn't show.
- Fixed: Calendar's weekday headers give screen readers the full name ("Monday") as text, not only in `abbr`, which some don't read.
- Changed: Calendar builds its date formats once per locale, not on every render.
