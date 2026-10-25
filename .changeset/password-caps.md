---
"serupa-ds": minor
---

PasswordInput: while Caps Lock is on, "Caps Lock is on" shows in the field, joins its description and is read out once (new `capsLockOn` label and `--password-input-caps` token; `capsLockHint={false}` turns it off). The README now says pasting is never blocked (WCAG 3.3.8), and a test checks it.
