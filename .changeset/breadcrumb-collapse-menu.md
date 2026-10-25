---
"serupa-ds": minor
---

- Added: `collapse="menu"` on Breadcrumb. With `maxItems`, "…" opens a Menu of the hidden pages, as links, instead of putting them back in the trail, so a deep trail stays on one line on a phone. The default, `'inline'`, works as before. New `morePages` label ("More pages"), in English and Indonesian (R4).
- Changed: Breadcrumb's separators sit inside the item after them, not in `<li>`s of their own, so the list has one item per page and screen readers count the levels right. A separator now wraps with its item, never ending a line on its own.
