---
"serupa-ds": patch
---

- Fixed: `SerupaProvider` with `labels` or `icons` written inline no longer re-renders every component under it each time its parent renders; only new contents do.
