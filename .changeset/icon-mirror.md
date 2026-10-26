---
"serupa-ds": minor
---

- Added: Icon's `mirror` prop. `'auto'` is the default and flips Material Symbols' directional icons (`arrow_forward`, `chevron_right`, `send`, `undo`…) in right-to-left text. `true` flips any icon and `false` flips none.
- Fixed: `<Icon name="arrow_forward">` and `<Button rightIcon="arrow_forward">Next</Button>` pointed the wrong way on a right-to-left page.
- Changed: Pagination, Breadcrumb, Calendar and Menu draw one chevron that flips, instead of a hidden pair for each direction.
