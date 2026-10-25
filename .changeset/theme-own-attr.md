---
"serupa-ds": patch
---

- Fixed: theme.js replaced a page's own `data-theme="violet-dark"` with blue-light (or blue-dark) before the first paint. A `data-theme` on `<html>` with no `data-brand` or `data-mode` is now the page default, and `reset()` goes back to it (Z1).
