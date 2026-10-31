---
"serupa-ds": patch
---

Pagination: before the script runs (server HTML ahead of hydration, or with JavaScript off), a long row now wraps onto more lines instead of running off a narrow page, and a page number never breaks across lines. Once mounted, the row stays on one line and steps its siblings and boundaries down to fit, as before.
