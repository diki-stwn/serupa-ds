---
"serupa-ds": patch
---

LoadMore: inside a shadow root, loading the last page from the button moves focus to the end text, and a load keeps the focused button in view, as on the page. Before, focus fell to the body, because LoadMore read `document.activeElement`, which is the shadow host there.
