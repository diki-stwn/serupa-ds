---
"serupa-ds": patch
---

- Fixed: Tooltip's onOpenChange is called only when it would show or hide. A press, a blur or the pointer passing over before the delay, while it was hidden, called onOpenChange(false), and a disabled Tooltip called onOpenChange(true) on hover and focus.
