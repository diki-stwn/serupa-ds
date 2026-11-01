---
"serupa-ds": minor
---

Table: a sticky header lifts once rows scroll under it (KW16). The header cells take a soft shadow (`--table-head-shadow-scrolled`, default `shadow-sm`) while the frame can scroll back up, so nothing shows at the top. It's a scroll-state container query, not an animation, so nothing runs on its own. Where scroll-state queries aren't supported, the header stays flat, as before.
