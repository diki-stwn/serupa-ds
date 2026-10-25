---
"serupa-ds": patch
---

- Fixed: tapping an element with a Tooltip on a touch screen showed the tooltip 400ms later and left it open, because the tap's mouseenter came with no mouseleave. Tooltip listens to pointer events and ignores touch, and a press outside hides an open tooltip (O2).
