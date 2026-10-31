---
"serupa-ds": patch
---

- Fixed: a Rating in a required Field, or given aria-required, says it is required (aria-required on its radiogroup); the attribute was dropped.
- Fixed: a click on a Field's label, or ref.current.focus() (a form library focusing the first invalid field), focuses the Rating's picked star, or else the first; nothing was focused.
