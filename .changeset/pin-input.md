---
"serupa-ds": minor
---

Added: PinInput, for a one-time code or PIN shown as one box per character (`length`, default 6).

- It's one native field under the boxes, so a phone's texted-code suggestion (`autocomplete="one-time-code"`), a paste and a password manager fill every box at once. A form submits the code by `name`, and labels, Field and screen readers treat it as an Input.
- `type="numeric"` (digits and a number keypad, the default) or `"alphanumeric"`. Other characters are dropped, so "123-456" fills six boxes.
- `value`, `defaultValue`, `onValueChange` and `onComplete`, plus `mask`, `size` (24, 32 and 44px boxes) and `invalid`.

Tokens: `--pin-input-*`.
