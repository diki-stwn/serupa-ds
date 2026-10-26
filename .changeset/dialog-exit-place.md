---
"serupa-ds": patch
---

- Fixed: Dialog no longer jumps to the top-left corner as it closes. It was centered only while open, so for the 150ms fade out the panel sat in the corner; it now shrinks and fades where it stood. The dialog also clips rather than hides its overflow, so focusing the panel's first control can't scroll it.
