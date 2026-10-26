---
"serupa-ds": patch
---

- Fixed: SortableList drops a dragged row where the pointer is let go. A release that came right after a move, before that move had rendered, dropped it at the earlier place, or not at all.
