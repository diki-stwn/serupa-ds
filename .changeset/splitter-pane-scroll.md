---
"serupa-ds": patch
---

Fixed: a Splitter pane whose content overflows takes Tab focus, so it can be scrolled from the keyboard when nothing inside it is focusable (WCAG 2.1.1), as Dialog's and Drawer's bodies already do. It shows the focus ring while focused.
