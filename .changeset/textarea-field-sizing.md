---
"serupa-ds": patch
---

- Changed: Textarea's `autoResize` uses CSS `field-sizing: content` where the browser has it (Chromium 123+, Safari 26+), with `rows` and `maxRows` as its least and most height. Nothing is measured while typing, and there's no frame at `height: auto` that could jump the page. Other browsers keep the measuring path.
