---
"serupa-ds": minor
---

New `data-type-scale="fluid"` theme axis: the heading sizes (`text-2xl` to `text-9xl`, and the `type-*` styles that use them) scale with the window, from 70% of their size on a 320px phone to their full size at 1280px. Body sizes don't change, browser zoom still enlarges the headings (at least double by 300%, since zooming also narrows the window), and `data-type-scale="fixed"` puts the fixed sizes back for one section. The `type-*` classes from `type-2xl` up now read their size from the matching `--text-*` token, so a theme that changes `--text-3xl` changes `type-heading-1` too.
