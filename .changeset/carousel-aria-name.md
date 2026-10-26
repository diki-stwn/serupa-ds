---
"serupa-ds": minor
---

- Fixed: Carousel kept no name when given `aria-label` instead of `label`, because its own `label` overwrote it with nothing; the region was read with only its role and the missing-name warning fired. `aria-label` now names it when there's no `label`.
- Changed: Carousel's `label` is optional when the carousel is named another way, by `aria-label` or by `aria-labelledby` pointing at a visible heading.
