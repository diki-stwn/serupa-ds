---
"serupa-ds": patch
---

- Fixed: a circle Progress given a `label` is named by it. Before, the ring ignored `label`, so it had no accessible name. Text becomes its aria-label, and other content names it through a hidden copy. `aria-label` and `aria-labelledby` still win.
