---
"serupa-ds": minor
---

Added: Toolbar, a `role="toolbar"` around a set of controls (an editor's formatting buttons, the tools beside a canvas) that takes one Tab stop instead of one per control. It follows the WAI-ARIA toolbar pattern:

- The arrow keys move between the controls: Left and Right in a row (mirrored right to left), Up and Down with `orientation="vertical"`. Home and End go to the first and last, and the keys wrap.
- Tab comes back to the control used last.
- Disabled controls, a Menu's items and text editing inside an Input are left alone.

Tokens: `--toolbar-bg`, `--toolbar-text`, `--toolbar-radius`, `--toolbar-padding` and `--toolbar-gap`.
