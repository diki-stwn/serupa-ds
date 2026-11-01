---
"serupa-ds": minor
---

`dist/debug.js` now checks contrast too. It tests the color pairs Serupa draws (text on each surface, button text, field borders, the focus ring) against WCAG 2.2 where they appear on the page, so a color token your app overrides can't quietly fail. When it turns on, the console lists the pairs that fail on the page. The panel adds the ones that fail on the component you point at, from a token set on it or around it. `Serupa.debug.contrast(el)` returns every pair with its ratio.
