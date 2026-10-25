---
"serupa-ds": patch
---

- Fixed: a Button whose `onClick` promise settled just after 300ms flashed its spinner for a frame or two, cut off mid fade-in. Once shown, the spinner now stays at least 500ms, and the `successText` check follows it.
