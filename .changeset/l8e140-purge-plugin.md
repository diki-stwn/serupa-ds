---
"serupa-ds": minor
---

New `serupa-ds/purge`: `serupa-purge` inside the build. Add `serupaPurge()` to Vite's plugins (or `serupaPurgePostcss()` to `postcss.config.mjs` for Next.js and webpack) and keep importing `bundle.css`: the production build ships the component styles and only the utility classes your code uses, as the command does, and the dev server keeps every class. Both take `content`, `keep` and `components`, and trim only Serupa's stylesheets (`utilities-extra.css` too). Getting started now shows this as the way to ship.

`serupa-purge` also trims the rules inside `@starting-style` now: with `--components`, the entry animations of components the sources never name were kept.
