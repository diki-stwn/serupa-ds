---
"serupa-ds": patch
---

base.css: under reduced motion, the page-wide rule that makes transitions instant now leaves components alone, so their own short reduced-motion fades (a Combobox or TimePicker popup appearing) work with base.css loaded too. Before, it turned them into a hard pop.
