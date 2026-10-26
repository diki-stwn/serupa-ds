---
"serupa-ds": patch
---

The mask utilities' internal variables have shorter names (for example `--dk-mask-bottom-from-color` is now `--dk-mask-b-from-c`), so utilities.css and bundle.css are about 54 KB smaller. The classes and how they render are unchanged. These variables were never documented, but if you set one directly, use the new name.
