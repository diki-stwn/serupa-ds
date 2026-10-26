---
"serupa-ds": patch
---

- Fixed: Highlight no longer shifts option text as you type. Inside an option or menu item a match keeps the text's weight and is underlined instead of turning semibold, so the letters don't widen on each keystroke and the ellipsis stays put. Elsewhere it's still semibold.
- Added: Heading's `--heading-line-height-1` to `--heading-line-height-6` tokens, to set with a `--heading-size-*` override so a larger size gets its own line height.
