---
"serupa-ds": patch
---

Combobox, Menu, TimePicker and CommandPalette lists use `contain: layout paint`, so a row changing (the highlight moving, a row being added) doesn't make the browser lay out the rest of the page again. They already scroll and clip, so nothing looks different.
