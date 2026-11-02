---
"serupa-ds": minor
---

Combobox: `inputValue` and `defaultInputValue` let an app own or seed the text in the field, as `value` and `defaultValue` do for the pick. `onInputChange` now hears every change to the text, not only typing: Escape, leaving the field and a new `value` putting a label back call it too, so a controlled field stays in step.
