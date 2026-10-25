---
"serupa-ds": patch
---

- Fixed: dragging a SortableList row couldn't scroll the list or the page, so a long list couldn't be reordered past the screen. Held near the top or bottom edge of what scrolls, it now scrolls that way, faster nearer the edge (R1).
- Fixed: SortableList rendered without `items` (from plain JavaScript) threw a TypeError. It renders an empty list now (AD2).
