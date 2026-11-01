---
"serupa-ds": patch
---

InlineEdit: inside a shadow root, switching to another window mid-edit keeps the field open, and an Enter whose `validate` promise settles later puts focus back on the text, as on the page. Before, InlineEdit read `document.activeElement`, which is the shadow host there, so the window switch saved the edit, and focus wasn't given back. Focus is now read through open shadow roots.
