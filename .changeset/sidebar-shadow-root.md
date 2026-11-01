---
"serupa-ds": patch
---

Sidebar: inside a shadow root, collapsing or expanding keeps focus in the item it was in, as it does on the page. Before, focus fell to the body, because Sidebar read `document.activeElement`, which is the shadow host there.
