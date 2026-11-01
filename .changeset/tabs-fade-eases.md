---
"serupa-ds": patch
---

Tabs: when the tab row overflows, the fade at an edge now eases in as tabs scroll past it and eases away as the row reaches it, instead of appearing and disappearing at once. Its widths are registered with `@property`, so they can transition. With reduced motion, it still changes at once.
