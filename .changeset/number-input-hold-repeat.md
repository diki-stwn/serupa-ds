---
"serupa-ds": minor
---

- Added: NumberInput's − and + repeat while held (one step, then after 400ms one every 50ms), stopping on release, on leaving the button, on Escape or at the limit.
- Added: NumberInput `onInvalidInput(text, reason)`: "range" when a typed number is brought back within min and max, "unreadable" when typed text isn't a number.
- Fixed: NumberInput tells screen readers when typed text that isn't a number is replaced by the previous number, as the date and time pickers do.
