---
"serupa-ds": patch
---

Popover: inside a shadow root, opening it now focuses its first control, as it does on the page. Before, it found no control that took focus and focused the panel instead, because it compared `document.activeElement`, which is the shadow host there.
