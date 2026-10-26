---
"serupa-ds": patch
---

Fixed: in an attached ButtonGroup or ToggleGroup, a small icon-only button showed less than its 24px target, under the WCAG 2.2 minimum (2.5.8). The buttons on either side overlap it by 1px, the one before it too when it's pressed, hovered or focused. It's now wider by both overlaps in a row, and a small button is taller by them in a column.
