---
"serupa-ds": patch
---

- Fixed: collapsing or expanding Sidebar animated its width, so the page beside it was laid out again on every frame and stuttered on heavy pages. Now the width changes once, and only a clip and the edge line slide, which the compositor runs alone. Toggling again mid-way turns back from where it is.
