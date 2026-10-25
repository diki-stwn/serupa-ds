---
"serupa-ds": minor
---

- Fixed: in a collapsed Sidebar, a group's menu dropped each item's `as` (a router's Link fell back to a full page load), its other link props and the current page. They're kept now, and the current page has `aria-current="page"` (S6).
- Fixed: a Sidebar group opened, and showed as active, only when a direct child was the current page. A grandchild counts too now (S7).
- Added: `MenuItem` takes `as`, a link component of its own in place of the `configure({ link })` one.
