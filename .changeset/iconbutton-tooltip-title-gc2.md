---
"serupa-ds": patch
---

- Fixed: IconButton inside a Tooltip no longer sets its own `title`, so the native tooltip doesn't show on top of the Tooltip. IconButton now leaves out the title whenever the button has `aria-describedby` or `aria-labelledby`, which is what a wrapping Tooltip adds, so `noTitle` isn't needed there. The README now points to `role="label"` for a Tooltip that repeats the label, so the name isn't read twice.
