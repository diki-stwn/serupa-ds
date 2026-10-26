---
"serupa-ds": patch
---

- Fixed: a press on DatePicker's box outside the text field (its side padding, past the calendar button) left focus where it was, though the box shows a text cursor. It now focuses the field with the caret at the end, as Input does. A press inside an open calendar is still the calendar's.
