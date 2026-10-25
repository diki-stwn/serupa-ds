---
"serupa-ds": patch
---

TreeView: a focus move, a pick or opening and closing one item now redraws only the rows it changes. With 3,060 items in view, an arrow key used to redraw all of them. Open and picked ids are kept in Sets, so Ctrl+A on a big tree is no longer quadratic, and focus finds its item by id.
