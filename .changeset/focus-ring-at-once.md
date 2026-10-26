---
"serupa-ds": patch
---

- Changed: the focus ring of Input, Textarea, Select and PinInput now shows at once instead of fading in over 100ms, and still fades out on blur. Focus is never late, PinInput's ring moves straight to the next box as you type, and a field focused as a Popover opens no longer animates on its first frame. That was the last mount motion the motion gate knew of.
