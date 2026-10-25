---
"serupa-ds": patch
---

Touch and scrolling, everywhere: every control that shows a pointer cursor (checkboxes, switches, tabs, menu items, options, calendar days, pagination and more) now sets `touch-action: manipulation`, so a tap responds without the double-tap-zoom wait. Menu, Popover, the tab list, the table and the Sidebar body no longer scroll the page once you reach their end. Drawer pads for a phone's notch and home bar, and Fab's offset is measured from the safe area. A new test checks both touch and scroll rules for every component.

With more contrast (`data-contrast="more"`, or the system's setting), the focus ring is 3px instead of 2px. With base.css, bare native controls (a plain checkbox, range or progress bar) and the text caret take the theme's brand color, a nested theme included.
