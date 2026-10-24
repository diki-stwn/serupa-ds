---
"serupa-ds": minor
---

- Added: a MenuItem's `shortcut` is now given to screen readers as `aria-keyshortcuts` ("⌘⇧K" becomes `Meta+Shift+K`), and the shown keys are left out of the item's name, so it reads "Edit" instead of "Edit command E" (idea 197). Pass `aria-keyshortcuts` to set it yourself.
