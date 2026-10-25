---
"serupa-ds": patch
---

- Fixed: a Tooltip used as the `trigger` of a Menu or Popover passes the props and ref they add (`aria-haspopup`, `aria-expanded`, `onClick` and the rest) on to its element, so a tooltipped icon button opens the menu. The element's own handlers run first and its own id is kept.
