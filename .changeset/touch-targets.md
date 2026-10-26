---
"serupa-ds": patch
---

- Changed: on touch screens (`pointer: coarse`), Checkbox, Radio, Switch, Slider, SegmentedControl and Breadcrumb take a press 44px high, as Apple and Material ask, without moving anything. In a CheckboxGroup or RadioGroup the press area stops halfway into the gap, so two never overlap. The Splitter's 8px handle takes a 24px-wide press. With a mouse they keep the 24px of WCAG 2.5.8.
