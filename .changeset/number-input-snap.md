---
"serupa-ds": patch
---

NumberInput: from a typed value between steps, the arrows, buttons and Page keys first go to the nearest step in that direction, as the native field and Slider do. 0.1 and ↑ with `step={0.25}` is now 0.25, not 0.35. Money shown with finer decimals than its step keeps them, so $19.99 and ↑ with a step of $1 is still $20.99.
