---
"serupa-ds": minor
---

NumberInput: the value is written in the locale's own digits, as Meter, Pagination and Calendar write numbers (`١٢٥٠٫٥` in ar-EG), instead of always in Latin digits. Typed digits are still read in any script, and the form still gets Latin digits. The new `numberingSystem` prop (or `formatOptions.numberingSystem`) picks the digits, for example `"latn"` to keep Latin.

Migration: in a locale with its own digits (ar-EG, fa-IR, and others), pass `numberingSystem="latn"` to keep the old display.
