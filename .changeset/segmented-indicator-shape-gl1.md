---
"serupa-ds": patch
---

Fixed (SegmentedControl): the selection no longer stretches while it slides between segments of different widths. Its border used to grow up to 2.5 times thicker and its corners went oval, because it changed size by `scale`. It now slides on `translate` and changes `width`, so its 1px border and round corners keep their shape all the way.
