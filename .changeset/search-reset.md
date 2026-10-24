---
"serupa-ds": patch
---

- Fixed: after a form reset, SearchInput emptied but kept showing its × (and pressing it sent another empty change). The × now follows the field: gone when it's empty, kept when the reset puts `defaultValue` back (Q1).
