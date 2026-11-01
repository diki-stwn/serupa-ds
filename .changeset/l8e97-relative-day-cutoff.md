---
"serupa-ds": patch
---

- Fixed: RelativeTime with a day on its own ("2026-10-24") showed the date instead of "7 days ago" a day early: absoluteAfter now counts calendar days, as the words do, so 7 days ago and in 7 days both stay words.
