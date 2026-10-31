---
"serupa-ds": patch
---

- Fixed: Tabs, SegmentedControl, ColorPicker swatches, Calendar, Slider, Splitter and Carousel's dots took the arrow keys even with Alt, Ctrl or ⌘ held, so Alt+← (back a page on Windows and Linux), ⌘+← and other browser and system shortcuts did nothing while one of them had focus. With a modifier held (Shift still counts as before), the keys are now left to the browser, as Toolbar and Radio already did.
