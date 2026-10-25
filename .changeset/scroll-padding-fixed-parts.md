---
"serupa-ds": patch
---

- Fixed: a fixed Fab no longer covers what the keyboard focuses. While it's in a corner, the page keeps scroll padding at that edge, so a focused link scrolls into view clear of it.
- Fixed: Table with `stickyHeader` no longer hides focused cells behind its header. The frame measures the header into scroll padding at the top.
