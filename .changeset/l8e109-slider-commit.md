---
"serupa-ds": patch
---

- Fixed: Slider, a press on a thumb let go where it was, or a drag that ends back where it began, no longer calls onValueCommit with the value it already had (a save on every click). A key press at the end already didn't.
