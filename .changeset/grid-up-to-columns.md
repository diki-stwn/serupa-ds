---
"serupa-ds": minor
---

- Added: Grid `columns` with `minColumnWidth` is "up to": `columns={3} minColumnWidth="240px"` shows three columns on a wide screen and fewer as they would get narrower than 240px, with no breakpoints. Before, `minColumnWidth` was ignored with a number.
- Added: Grid `fill` stretches a short row's cells across the empty columns (auto-fit), so two cards on a wide screen share the width.
- Fixed: a Grid inside another took the outer Grid's `gap` and `minColumnWidth` when it had none of its own. It now starts from its own defaults.
