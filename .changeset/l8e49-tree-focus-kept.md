---
"serupa-ds": patch
---

- Fixed: in a TreeView, focus dropped to the page when the focused item was taken out of `items` or its parent was closed through a controlled `expanded`. It now goes to the nearest parent in view, or else the item now in its place.
