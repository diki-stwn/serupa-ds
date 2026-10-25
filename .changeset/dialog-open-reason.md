---
"serupa-ds": minor
---

Dialog: onOpenChange gets `{ reason }` as its second argument: `'escape'`, `'close'` (the ×), `'outside'` (the backdrop) or `'api'` (the browser closed it, as `dialog.close()` or a `method="dialog"` form do). `OpenChangeReason` gains `'api'`.
