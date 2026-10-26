---
"serupa-ds": minor
---

- Added: Image `sources` puts the picture in a `<picture>` with one `<source>` per version, for another crop on some screens (`media`) or a lighter format (`type`).
- Added: a lazy Image whose `srcSet` lists widths gets `sizes="auto"` (before any `sizes` you give), so the browser loads the file that fits the frame's laid-out width.
