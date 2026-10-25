---
"serupa-ds": minor
---

- Added: InlineEdit's `validate` can return a Promise, for a check on the server. The field stays open and `aria-busy` until it settles, and only the latest check counts: typing or Escape drops the one running.
