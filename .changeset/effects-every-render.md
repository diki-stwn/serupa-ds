---
"serupa-ds": patch
---

Fixed: Textarea with `autoResize` and Stepper no longer measure after every render of a parent. Textarea refits when its value, size, row count or text changes, and Stepper measures again only when its steps' text or orientation changes, not each time an inline `steps` array is passed.
