---
"serupa-ds": patch
---

Menu, Popover, Combobox, DatePicker and TimePicker panels, Toast and Tooltip take their stacking level from the named layers (`z-popover`, `z-toast`, `z-tooltip`) instead of `z-50`. This only matters where the browser has no top layer: there a menu or picker opened inside a dialog now sits above it, and toasts and tooltips stay above both.
