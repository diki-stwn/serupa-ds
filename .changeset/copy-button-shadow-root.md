---
"serupa-ds": patch
---

CopyButton: inside a shadow root, the `execCommand("copy")` fallback (for browsers without the Clipboard API) puts focus back on the button, as on the page. Before, focus was left on the page, because CopyButton read `document.activeElement`, which is the shadow host there.
