---
"serupa-ds": patch
---

SortableList: an item moved with the arrow keys is scrolled into view as it moves, so in a list or row longer than its box (or the screen), the focused item no longer travels out of sight and stays there after the drop (GR69, WCAG 2.4.11). It scrolls only as far as needed, and only once the item has moved.
