---
"serupa-ds": minor
---

RadioGroup: `onValueChange(value, event)` is the new name for `onChange`, so every composite (SegmentedControl, Tabs, Slider, Select) uses the same one. `onChange` still works and gets the same arguments after `onValueChange`, but it's deprecated: it warns once in the console and goes in the next major.

Migration: rename `onChange` to `onValueChange` on each RadioGroup. Nothing else changes. The `onChange` of a single Radio is the native input event and stays.
