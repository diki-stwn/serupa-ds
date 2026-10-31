---
"serupa-ds": minor
---

Combobox takes the type of its values: `Combobox<'red' | 'green'>`, or inferred from `options`, so `onValueChange` gets that union (a list of it with `multiple`); given, a `value` or `defaultValue` outside it is a type error. `options`, `value` and `defaultValue` also accept readonly arrays. Untyped use is unchanged (`string`).
