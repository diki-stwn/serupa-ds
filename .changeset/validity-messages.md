---
"serupa-ds": minor
---

- Added: Input and Textarea can report a failed native constraint (`required`, `type`, `minLength`, `min`, `max`, `step`, `pattern`) in the provider's language rather than the browser's, through a new `invalidValue` label. `idLabels` has Indonesian messages. English keeps the browser's own, and a message set with `setCustomValidity` still wins.
