---
"serupa-ds": patch
---

- Fixed: a controlled NumberInput whose parent kept its value (or changed it) after onValueChange still showed the stepped or typed number. After a step, Enter or blur the field now shows the `value` prop. A new `value` from outside also shows while the field has focus, as long as people aren't typing in it (AF1).
