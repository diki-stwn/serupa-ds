---
"serupa-ds": patch
---

IconButton `noTitle` and Table `captionHidden` stay deprecated, but their removal moves from 12.0.0 to 13.0.0: 12.0.0 shipped with them still in, so their docs and development warnings now name the next major. Both still work as before. Rename them to `hideTitle` and `hideCaption` before 13.0.0.
