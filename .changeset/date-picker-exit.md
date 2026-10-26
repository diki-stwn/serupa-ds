---
"serupa-ds": patch
---

- Changed: DatePicker's and DateRangePicker's calendar popup fades and shrinks back over 100ms when it closes, instead of vanishing (where the browser can keep it in the top layer: Chromium today), with the calendar kept, inert, until the fade ends. It enters with a transition rather than keyframes, so closing it mid-way turns back from where it is. Reduced motion: the fade alone.
