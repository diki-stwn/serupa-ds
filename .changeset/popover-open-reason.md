---
"serupa-ds": minor
---

Popover: onOpenChange gets a second argument, `{ reason }`, saying why it opened or closed: `'trigger'`, `'escape'`, `'outside'`, `'blur'` or `'close'` (the close() its children function gets). The `OpenChangeReason` and `OpenChangeDetails` types are exported for the other overlays to use next.
