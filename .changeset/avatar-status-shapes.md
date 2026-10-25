---
"serupa-ds": patch
---

- Fixed: Avatar's four statuses differed only by color, and looked the same in forced-colors mode. Each now has its own shape: online a filled dot, busy a dot with a bar, away a ring with a dot, offline an empty ring.
- Fixed: an Avatar with `alt=""` and a status hid the status from screen readers. The dot is now read on its own ("online").
