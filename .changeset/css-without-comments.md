---
"serupa-ds": patch
---

- Changed: `components.css`, `utilities.css`, `bundle.css` and `base.css` ship without the source comments, which made up about 40% of `components.css`. It drops from 42.8 to 26.6 KiB gzipped, and `bundle.css` from 208 to 186 KiB. The rules are the same and keep their layout; the commented source stays in `src/`.
