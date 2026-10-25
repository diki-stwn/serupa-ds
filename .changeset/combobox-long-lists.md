---
"serupa-ds": patch
---

Combobox handles long option lists. Its options are in the page only while the list is open, so a closed Combobox with 2,000 options has no option nodes. Each label is folded for matching once per `options` array instead of on every render, and the option rows are memoised, so moving the highlight redraws two rows instead of every row.
