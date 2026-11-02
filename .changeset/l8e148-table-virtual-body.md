---
"serupa-ds": minor
---

Table: `TableVirtualBody` (beta), a `<tbody>` that draws only the rows in view of the Table's scrolling frame, so a table of 10,000 rows scrolls as quickly as one of 20. Use it in place of `TableBody` with `count` and `renderRow(index)`, and give the frame a height. Drawn rows get `aria-rowindex` and the table `aria-rowcount`, a focused row stays drawn when it scrolls away, and `striped` shades the same rows as a `TableBody`. It shares the windowing behind VirtualList and Combobox.
