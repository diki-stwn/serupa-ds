---
"serupa-ds": patch
---

- Fixed: under a strict Content Security Policy (no `'unsafe-inline'` in `style-src-attr`), server-rendered Progress, Meter, Slider, ColorPicker and the other style-setting components now show their values after hydration in Firefox too. Firefox empties a style attribute it blocks, so there was nothing to apply again; the styles now come from what React hydrated the element with.
