---
"serupa-ds": minor
---

The plain-page script is about a fifth of its size: `serupa.iife.js` goes from 610 KiB to 119 KiB gzipped (3.1 MB to 372 KB raw), because the full Material Symbols table moved back into `serupa-icons.iife.js`. The components' own icons and the everyday ones stay in `serupa.iife.js`. The first time an Icon names any other icon, `serupa.iife.js` adds `serupa-icons.iife.js` to the page from its own folder (same origin, so `script-src 'self'` still covers it), so pages need no change as long as the two files sit side by side. A page that names many icons can include `serupa-icons.iife.js` after `serupa.iife.js` to draw them on the first try. Pages with Trusted Types enforced should include it that way, since a script added at run time needs a policy there.
