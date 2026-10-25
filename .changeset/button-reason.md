---
"serupa-ds": minor
---

- Added: `disabledReason` on Button. With `disabled`, the button stays focusable (`aria-disabled`) so keyboard and screen reader users can reach it and hear why, and a Tooltip around it now shows on hover and focus, which a disabled button never could (idea 214).
- Added: an `onClick` that returns a promise makes the Button load until it settles, so a slow request can't be sent twice without your own loading state (idea 199).
- Added: `successText` on Button: after that promise resolves, a check replaces the label for 2 seconds and the text ("Saved") is announced (idea 16).
