---
"serupa-ds": patch
---

Input: with `mask`, inside a shadow root, an edit in the middle keeps the caret after the same character, as on the page. Before, it jumped to the end, because Input read `document.activeElement`, which is the shadow host there.
