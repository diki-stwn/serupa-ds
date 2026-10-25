---
"serupa-ds": patch
---

Toaster starts empty and reads the toast queue after it mounts, as it already did on a server render. A `toast()` called during a server render can no longer show up in another request's HTML.
