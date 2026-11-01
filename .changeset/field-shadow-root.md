---
"serupa-ds": patch
---

Field: inside a shadow root, clicking the label of a Slider, SegmentedControl or ColorPicker now focuses it. It also no longer warns in development that the label names nothing. The accessible-name check behind the "has no accessible name" warning (Slider, Dialog and others) now finds an `aria-labelledby` target in the shadow root as well, so it no longer warns there by mistake.
