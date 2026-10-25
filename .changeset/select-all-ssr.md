---
"serupa-ds": patch
---

- Fixed: CheckboxGroup's `selectAll` box rendered disabled and unchecked on the server, and so until hydration, even when `defaultValue` checked some or all boxes. It now counts the Checkboxes among the group's children until they register, so it is enabled and checked or mixed from the first paint.
