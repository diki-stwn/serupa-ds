---
"serupa-ds": minor
---

- Added: motion role tokens. They name what moves rather than how long it takes: `--motion-press`, `--motion-hover`, `--motion-enter-sm`/`-md`/`-lg`, `--motion-exit-sm`/`-md`/`-lg`, `--motion-loop-spinner` and `--motion-loop-placeholder`, plus the easings `--ease-enter`, `--ease-exit` and `--ease-move`. Each points at a step of the duration or easing scale and starts at the values the components use today. They're also in the W3C Design Tokens export, as references.
- Fixed: the duration tokens' descriptions now match how the components use them. Tooltips, popovers and menus enter in 150ms, dialogs and toasts in 200ms, and drawers in 300ms.
- Fixed: the focus ring's width and offset tokens are exported to design-tokens/ as references to the outline scale. They used to be CSS-only values that held a literal `{…}`.
- Changed: the Motion foundations page covers when to animate, the roles, timing, easing, sequencing, performance and reduced motion.
