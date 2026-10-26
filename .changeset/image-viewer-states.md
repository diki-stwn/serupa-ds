---
"serupa-ds": minor
---

- Fixed: Image's viewer had no loading state and no fallback. A large full-size picture showed an empty dialog while it loaded, and the browser's broken-image icon if it failed. It now has the frame's placeholder, in the picture's shape, and the frame's fallback.
- Changed: with no `fullSrc`, the viewer shows the largest `srcSet` candidate instead of `src`, which is often the smallest.
- Fixed: the viewer's picture has `alt=""`, since the Dialog's title already names it, so screen readers don't read the alt text twice.
