---
"serupa-ds": patch
---

Fixed (SegmentedControl): the selection no longer stretches while it slides between segments of different widths. Its border used to grow up to 2.5 times thicker and its corners went oval, because it changed size by `scale`. It now slides by `clip-path`, which the compositor still runs, cut to the selection's shape with its 1px border and round corners all the way. At rest it looks exactly as before.
