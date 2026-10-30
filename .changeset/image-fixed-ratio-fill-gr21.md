---
"serupa-ds": patch
---

Image: with a fixed `ratio` and no size of its own, the frame now takes its container's width, so it has its shape while the picture loads and keeps it if the picture fails. Before, it was 0x0 while loading and a 62px stub when broken, and the page jumped when the picture arrived (GR21). Give the frame (or the picture) a width for a smaller one.
