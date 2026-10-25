---
"serupa-ds": patch
---

- Fixed: `autoFocus` on a child of a Dialog or Drawer never took effect, because React focuses it while the dialog is still hidden. Focus always landed on the ×. Put `data-autofocus` (or the HTML `autofocus` attribute) on the child, and opening focuses it (BD1).
- Fixed: a press on the backdrop of a Dialog or Drawer while a Menu or Popover was open inside closed both at once. It now closes only the popup, and the next press closes the dialog (BG1).
