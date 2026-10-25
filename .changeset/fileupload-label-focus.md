---
"serupa-ds": patch
---

- Fixed: clicking a `<label for>` that points at a FileUpload opened the picker but left focus on its hidden input, with no focus ring and a screen reader on a hidden element. Focus now goes to the choose button.
