---
"serupa-ds": patch
---

Fixed (Button): `onClick`'s type accepts a handler that returns a promise (or anything else), matching what the button already does with it: no second click until the promise settles, loading while it takes a while, then `successText`.
