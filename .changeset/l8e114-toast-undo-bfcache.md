---
"serupa-ds": patch
---

- Fixed: a `toast.undo` toast is closed when the page comes back from the back/forward cache. Leaving the page had already committed the action, so its Undo button could no longer undo anything.
