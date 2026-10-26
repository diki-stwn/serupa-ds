---
"serupa-ds": patch
---

- Fixed: after ErrorBoundary's Try again (or a custom fallback's `reset()`, or a `resetKeys` change while focus was in the fallback), the fallback went with focus in it and focus fell to `<body>`, so keyboard and screen reader users were sent back to the top of the page. Focus now moves to the first focusable part of the recovered content, or, when it has none, to its first element for that one move.
