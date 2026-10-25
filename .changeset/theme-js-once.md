---
"serupa-ds": patch
---

- Fixed: `theme.js` loaded twice (an inline copy plus the file, or two bundles) made two independent copies. The first one's `onChange` subscribers missed later changes, its `get()` went stale, and on a system light/dark switch it could write its own theme over the visitor's choice. A second copy now does nothing.
- Fixed: `localStorage.clear()` in another tab left this tab on the old choice until a reload. It now goes back to the page default, as with `reset()`.
