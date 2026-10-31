---
"serupa-ds": patch
---

- Fixed: in Calendar, ColorPicker, Carousel and Splitter your onKeyDown now runs first, on the root, so calling preventDefault() in it stops the component's own arrow-key handling, as it already did in Slider and SegmentedControl (L8E32).
