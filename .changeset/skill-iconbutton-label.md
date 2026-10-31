---
"serupa-ds": patch
---

The Serupa skill for coding agents and the accessibility checklist in the foundations guide said to give every IconButton an `aria-label`. IconButton's name is its required `label` prop, and its type leaves out `aria-label`, so an agent that followed the skill wrote code that didn't type-check. Both now say `label`.
