---
"serupa-ds": patch
---

Carousel: inside a shadow root, reaching the last slide moves focus to Previous (and the first, to Next), as it does on the page. Before, focus fell to the body when the button that had it hid, because Carousel read `document.activeElement`, which is the shadow host there.
