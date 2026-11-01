---
"serupa-ds": minor
---

Added: `dist/debug.js` (`serupa-ds/debug.js`), an opt-in debug overlay. Load it on a page and add `?serupa-debug` to the address: every Serupa component gets a dashed outline, and pointing at one shows its name, its variant and size classes, its state (`data-state`, `aria-expanded`, disabled and the like), its size in px, and the component tokens that have a value on it, so an override your app sets shows up. It stays on for the tab until Escape or `Serupa.debug.off()`. `Serupa.debug.inspect(element)` returns the same as an object. It is standalone and not part of `serupa.iife.js` or the ES modules, so nothing else pays for it.
