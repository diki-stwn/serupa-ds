---
"serupa-ds": minor
---

Stronger easing, and large type styles set tighter.

- `--ease-exit` is now the strong ease-out `ease-out-quart`, not `ease-in`. Menus, popovers, dialogs, drawers, tooltips and toasts are mostly gone in the first frames of a close, so closing feels quicker in the same duration.
- `--ease-out` now points at `ease-out-quart`, and `--ease-in-out` at `ease-in-out-cubic`, in place of the softer `cubic-bezier(0, 0, 0.2, 1)` and `cubic-bezier(0.4, 0, 0.2, 1)`. This also changes the default curve of the `transition` and `ease-out` / `ease-in-out` utility classes, and the Loader's dots, pixels, shine and placeholder sweep.
- `type-2xl` to `type-5xl` carry `tracking-tight` (-0.025em), and `type-6xl` to `type-9xl` `tracking-tighter` (-0.05em), so a large text style matches a Heading of the same size.

To keep an old curve, set it in your theme: `--ease-exit: var(--ease-in);`, `--ease-out: cubic-bezier(0, 0, 0.2, 1);` or `--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);`. To keep the old tracking, set `letter-spacing: 0` next to the `type-*` class.
