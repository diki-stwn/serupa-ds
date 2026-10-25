---
"serupa-ds": patch
---

- Fixed: in an attached ButtonGroup, a button that was a Menu trigger or sat in a Tooltip lost its outer corners, because the popup that follows it made it not the last child. The first and last buttons are now found among the buttons, so a split button's menu button is rounded on its end.
