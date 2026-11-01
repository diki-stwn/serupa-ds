---
"serupa-ds": patch
---

PhoneInput: inside a shadow root, an edit in the middle of the number keeps the caret where you typed, as on the page. Before, it jumped to the end, because PhoneInput read `document.activeElement`, which is the shadow host there.
