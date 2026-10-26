---
"serupa-ds": patch
---

- Fixed: an IconButton given `aria-label` instead of `label` had no accessible name, because it set `aria-label={label}` over it, and the warning said the button needed an aria-label it had been given. `aria-label` now names it, and its title too, when `label` is missing.
