---
"serupa-ds": major
---

Combobox draws only the option rows in view, as VirtualList does, instead of the first 100 with a "Keep typing to narrow N more" line. Scrolling and the arrow and Page keys now reach every match in a long list, and the highlighted option is always drawn.

**Migration:** the `moreResults` label is gone, since nothing shows it. Remove `moreResults` from any labels object you pass to `<SerupaProvider labels>` (TypeScript flags it as an unknown property). If you styled `.dk-combobox__more`, remove that rule too. The list's popup is now a flex column whose `.dk-combobox__listbox` scrolls, so a style that set `overflow` or `max-height` on `.dk-combobox__popup` to change the scrolling should move to the listbox; `--combobox-listbox-max-height` still sets the height.
