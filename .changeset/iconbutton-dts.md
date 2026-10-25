---
"serupa-ds": minor
---

Changed: IconButton's ref type is now declared as `IconButtonElement` (`HTMLButtonElement | HTMLAnchorElement`, the same type as before). The type declarations then print it the same way on every build, so index.d.ts no longer changes from one build to the next.
