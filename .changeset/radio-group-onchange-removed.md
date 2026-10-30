---
"serupa-ds": major
---

- **Breaking.** Removed (RadioGroup): the `onChange(value, event)` alias, deprecated in 9.2.0, and its `radio-group-onchange` warning. TypeScript now rejects `onChange` on a RadioGroup; from plain JavaScript it reaches the group `<div>` as an ordinary change handler and gets the radios' bubbling change event, not `(value, event)`. **Migration:** rename `onChange` to `onValueChange` on each RadioGroup; it takes the same `(value, event)`. A single Radio's `onChange` is the native input event, as before.
