---
"serupa-ds": patch
---

Fixed: in an attached ButtonGroup or ToggleGroup, a small icon-only button kept only 23px of its 24px target showing where the next button overlaps it, under the WCAG 2.2 minimum (2.5.8). It's wider by the overlap in a row, and a small button is taller by it in a column.
