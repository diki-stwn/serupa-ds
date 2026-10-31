---
"serupa-ds": patch
---

- Fixed: FileUpload's `accept` takes the names a file picker treats as one, so `.jpg` lets photo.jpeg in (and .jpe, .jfif), `.tiff` a .tif, `.html` a .htm, and `image/jpg` (often written for image/jpeg) a JPEG, instead of refusing a file the picker offered (L8E12).
