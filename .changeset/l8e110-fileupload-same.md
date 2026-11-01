---
"serupa-ds": patch
---

- Fixed: FileUpload with multiple, adding files that are all refused (a duplicate, a wrong type, one too large) no longer calls onFilesChange with a copy of the same list, which an app that uploads on change took as new files.
