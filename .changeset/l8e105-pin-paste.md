---
"serupa-ds": patch
---

- Fixed: PinInput, a whole code pasted after a few characters were typed now replaces them, instead of being added after them and cut off (typing 12 and pasting 483 921 gave 124839, and onComplete got that).
