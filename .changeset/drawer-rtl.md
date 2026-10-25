---
"serupa-ds": patch
---

- Fixed: in a right-to-left page, `side="right"` placed the Drawer on the left while it slid in from the right, crossing the whole screen, and `side="left"` did the opposite. `side` is physical, so each drawer now opens on the edge it names and slides in from. The safe-area padding follows the same edge (AZ2).
