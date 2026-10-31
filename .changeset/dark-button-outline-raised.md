---
"serupa-ds": minor
---

- Changed: in the dark themes, Button's `secondary` and `outline` variants (destructive ones included) sit on `surface-raised` (`zinc-800`), one step lighter than the `zinc-900` page, instead of on `surface`. Light themes don't change: `surface-raised` is white there too. Text keeps WCAG 2.2 AA in all three dark themes (lowest is violet `primary` at 5.5:1), and hover keeps its colors. The new defaults are `--button-secondary-bg`, `--button-outline-bg`, `--button-destructive-secondary-bg` and `--button-destructive-outline-bg`: `surface-raised` (was `surface`). Set them back to `var(--surface)` to keep the old look.
