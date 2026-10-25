---
"serupa-ds": patch
---

- Fixed: printing a page with `data-mode="dark"` gave light text on white paper, since printers drop backgrounds. `base.css` now prints `data-mode` pages and sections in their light colors, and a flat `*-dark` theme keeps its backgrounds when printed.
- Fixed: a nested `data-mode`, `data-brand` or `data-theme` section switched the components inside it but its own plain text kept the page's color on a transparent background. With `base.css` it now takes its theme's `text` color and `surface` background, with no specificity, so a class on the section still wins.
