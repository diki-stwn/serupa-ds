---
"serupa-ds": minor
---

Menus, popovers, combobox lists and the date and time pickers no longer animate when the keyboard opens or closes them. Opened by Enter, Space or an arrow key, they are there in the first frame, and closed by Escape they are gone in the same frame. A pointer or a tap keeps the fade and scale. This covers Menu (its submenus and ContextMenu too), Popover, Combobox, DatePicker, DateRangePicker and TimePicker. Nothing to change in your code.
