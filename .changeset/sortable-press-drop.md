---
"serupa-ds": patch
---

SortableList: with an item picked up, pressing another row's handle drops the item in that row's place again, as it is meant to. Before, an ordinary press (held for more than a frame) moved focus to the other handle first, which cancelled the pick-up, and the click then picked up the other row instead.
