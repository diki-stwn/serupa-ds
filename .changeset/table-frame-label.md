---
"serupa-ds": patch
---

- Fixed: an `aria-label` in Table's `containerProps` landed on the frame even when the table fit and the frame had no role, which axe reports as a prohibited attribute. The frame is named only while it scrolls and is a region (N6).
