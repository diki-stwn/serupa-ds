---
"serupa-ds": patch
---

- Fixed (Textarea): with `autoResize`, a server-rendered Textarea keeps its rows height after hydration under a strict Content Security Policy (`style-src-attr` without `'unsafe-inline'`).
