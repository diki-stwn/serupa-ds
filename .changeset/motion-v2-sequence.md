---
"serupa-ds": minor
---

Added: `motion-sequence` (50ms), the offset between the steps of one entrance.

Changed: Dialog and a modal Drawer enter as a sequence. The backdrop starts fading in, and the panel follows `motion-sequence` later, so the page dims and the panel arrives on it. They still leave together.

Changed: Menu's items arrive one after another as it opens. Each fades and drops 4px into place `motion-stagger` (50ms) after the one before, counted across groups and capped at `motion-enter-sm`, so a menu of any length is in within 300ms. Closing still fades the menu as one. ContextMenu and submenus do the same. Under reduced motion the items arrive with the menu.
