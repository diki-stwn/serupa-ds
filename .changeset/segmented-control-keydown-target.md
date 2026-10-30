---
"serupa-ds": patch
---

- Fixed: SegmentedControl's `onKeyDown` now gets the root element as `event.currentTarget`, as its type says, instead of the segment button that had focus. It still runs before the control's own arrow-key handling, so `preventDefault()` there still stops it.
