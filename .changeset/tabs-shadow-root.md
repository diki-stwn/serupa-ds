---
"serupa-ds": patch
---

Tabs: inside a shadow root, the arrow keys, Home and End now move focus and the selection. Tabs compared `document.activeElement`, which is the shadow host there, so the keys did nothing. A new internal helper reads focus and ids from the element's own document or shadow root. Other components move to it next.
