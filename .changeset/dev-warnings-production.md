---
"serupa-ds": patch
---

Console warnings are for development only. Every warning a component gives (an icon-only Button with no label, a Tabs value that matches no tab, a Field label with no control, and the rest) now sits behind `process.env.NODE_ENV !== "production"`, so your bundler's production build drops the warnings and their text. `serupa.iife.js` keeps them, since a plain page has no build step.
