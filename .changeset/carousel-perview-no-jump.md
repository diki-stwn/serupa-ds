---
"serupa-ds": patch
---

Carousel: `perView` with a breakpoint map (`{ base: 1, md: 2, lg: 3 }`) now lays out the right number of slides from CSS, so a server-rendered page shows two or three slides from the start instead of one that jumps to the count for the width when the page hydrates. The dots past the last page at that width are hidden until then too.
