---
"serupa-ds": patch
---

Motion roles in components (FI1): hover and focus color changes use `motion-hover` with `ease-move`, and popups, toasts and drawers use the enter roles with `ease-enter`, at the same speeds as before, so changing a role now moves them. Switch, Checkbox and Radio answer a toggle in 100ms (`motion-press`) instead of 150ms, as the Motion page asks for feedback.
