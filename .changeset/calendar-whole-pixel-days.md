---
"serupa-ds": patch
---

Calendar: on a narrow screen, where a day shrinks to fit the week, its size snaps down to a whole pixel (37px instead of 37.14px at 320px), so the day circles and the range band keep sharp edges. Browsers without `round()` keep the unrounded size.
