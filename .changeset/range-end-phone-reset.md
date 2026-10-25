---
"serupa-ds": patch
---

- Fixed: in DateRangePicker, an end date typed before the start vanished on blur with no word. It's now put back and reported like a date outside `min`..`max`: `onInvalidInput(text, "unavailable")`, and screen readers hear that it wasn't accepted (AS1).
- Fixed: PhoneInput ignored `form.reset()`, so the form kept sending, and the field kept showing, the changed number. A reset now puts `defaultValue` and `defaultCountry` back (AJ1).
