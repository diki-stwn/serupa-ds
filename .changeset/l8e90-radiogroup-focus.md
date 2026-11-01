---
"serupa-ds": patch
---

- Fixed: ref.current.focus() on a RadioGroup (a form library focusing the first invalid field) focuses its checked radio, or else the first that can be picked; nothing was focused. aria-required given to the group is kept.
