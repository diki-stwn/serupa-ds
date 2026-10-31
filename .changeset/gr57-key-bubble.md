---
"serupa-ds": patch
---

- Fixed: Splitter, Carousel, Calendar and ColorPicker run your onKeyDown as keys bubble up again, after the controls inside them. An onKeyDown that stops propagation no longer stops a Combobox, Input or other control inside from getting its keys (GR57; undoes L8E32).
