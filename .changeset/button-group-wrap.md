---
"serupa-ds": minor
---

- Fixed: an attached ButtonGroup wider than its container wraps as separate buttons (with `data-wrapped`) instead of scrolling the page sideways, and joins again once there's room. ButtonGroup is now a client component.
- Added: `--button-group-divider`, the edge between two attached primary buttons in their text color, which keeps 3:1 on the button in all six themes.
- Changed: the README sends sets of ToggleButtons, such as text formatting, to Toolbar.
