---
"serupa-ds": minor
---

- Added: `orientation="vertical"` on Tabs. The tabs form a column at the start of the panels, with `aria-orientation="vertical"` and ↑ ↓ between them, and the line variant's line on the column's end side (O4).
- Fixed: a tab row with more tabs than fit gave no sign of the rest, and a selected tab past the edge stayed out of sight. The edge with more tabs past it now fades out over 32px (new `--tabs-fade-size` token), and the selected tab is scrolled into view whenever it changes, without scrolling the page.
