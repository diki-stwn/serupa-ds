---
"serupa-ds": minor
---

SegmentedControl takes the type of its values: `SegmentedControl<'list' | 'board'>`, or inferred from `options`, so `onValueChange` gets that union; given, a `value` or `defaultValue` outside it is a type error. Untyped use is unchanged (`string`).
