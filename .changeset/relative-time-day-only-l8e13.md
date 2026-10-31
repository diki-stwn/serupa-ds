---
"serupa-ds": patch
---

- Fixed: RelativeTime read a day on its own ("2026-10-24") as UTC midnight, so west of Greenwich yesterday showed as "2 days ago", and a day from this morning as "14 hours ago". It's now that local day, counted in days ("today", "yesterday"), with the date alone as its tooltip and the day as its `datetime`.
