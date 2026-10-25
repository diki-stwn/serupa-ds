---
"serupa-ds": minor
---

- Added: `defaultOpen` on Dialog and Drawer, so they can be open on arrival without a state of their own. `open` is now optional: without it, Escape, the × and the backdrop close them by themselves, and `onOpenChange(false)` still comes. Menu, Popover and Tooltip already had `defaultOpen`; their tests now cover it.
