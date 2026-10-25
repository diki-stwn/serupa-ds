---
"serupa-ds": patch
---

- Fixed: InlineEdit said nothing when `validate` kept the field open. Focus stays in the field, and screen readers don't read a focused field's description again, so the message was only shown. It's now announced politely on each failed try, as Field announces its errors.
