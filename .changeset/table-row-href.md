---
"serupa-ds": minor
---

TableRow: `href` (with `target` and `rel`) makes the whole row a link. One real `<a>` sits in the row's first `TableCell` (or the one marked with the new `link` prop) and its area covers the row, so a click anywhere follows it, Ctrl/Cmd-click and middle-click open a new tab, and the keyboard tabs to it. Buttons and checkboxes in other cells still work on their own. `onClick` on a row without `href` now warns in development, since it reaches mouse users only.
