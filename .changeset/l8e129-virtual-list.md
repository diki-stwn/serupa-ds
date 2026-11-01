---
"serupa-ds": minor
---

New VirtualList (beta): a List of any length that draws only the rows in view, plus a few either side. Rows are ListItems, measured once drawn, so rows of different heights work; the scroll stays still when rows above the view turn out taller or shorter. Each drawn row has `aria-posinset` and `aria-setsize`, the list scrolls from the keyboard, and the row with focus stays drawn while scrolled away. Its windowing (`useVirtual`, internal for now) is shared, so Combobox and Table can use it next.
