---
"serupa-ds": minor
---

Combobox: `open`, `defaultOpen` and `onOpenChange(open, { reason })`, as Menu, Popover and the other overlays have. The reason is `'trigger'` (typing, the arrow keys, a click or the chevron), `'escape'`, `'blur'`, `'select'` or `'api'` (a form reset), so an app can keep the list open, shut it, or open it from elsewhere.
