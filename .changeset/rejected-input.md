---
"serupa-ds": minor
---

- Added: `onInvalidInput(text, reason)` on DatePicker, DateRangePicker and TimePicker. Typed text that isn't a date or time ("unreadable"), or is one that can't be chosen ("unavailable"), used to be put back on blur without a word. Now the app hears why, and screen readers hear that it wasn't accepted (the `inputNotAccepted` label, Indonesian in `idLabels`) (R35, M1).
