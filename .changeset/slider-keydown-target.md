---
"serupa-ds": patch
---

- Fixed: Slider's `onKeyDown` now gets the root element as `event.currentTarget`, as its type says, instead of the thumb that had focus. It still runs before the slider's own key handling, so `preventDefault()` there still stops it.
