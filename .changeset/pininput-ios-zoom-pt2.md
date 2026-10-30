---
"serupa-ds": patch
---

- Fixed: PinInput size `sm` no longer zooms the page on iPhone when focused. Its hidden field took the 14px text, under the 16px at which iOS Safari zooms into a field. On iOS it now takes 16px, as Input, Select and Textarea do. The field is transparent, so nothing changes on screen (PT2).
