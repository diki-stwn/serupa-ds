---
"serupa-ds": minor
---

- Added: the `field-readonly` color token, the background of read-only and disabled form fields (`zinc-50` in light, `zinc-900` in dark). Input, Textarea, PinInput and Select use it by default for `--input-bg-readonly`, `--textarea-bg-readonly`, `--pin-input-bg-readonly` and `--select-bg-disabled` (was `surface-muted`). Light themes look the same. In dark, now that `field` is `zinc-800`, a read-only field sits a step flatter than an editable one instead of matching it.
