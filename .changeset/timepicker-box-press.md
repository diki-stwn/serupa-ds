---
"serupa-ds": patch
---

- Fixed: a press on TimePicker's box outside the text field (its start padding, past the clock button) left focus where it was, though the box shows a text cursor. It now focuses the field with the caret at the end, as Input does.
