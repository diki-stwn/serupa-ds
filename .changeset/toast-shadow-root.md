---
"serupa-ds": patch
---

Toast: inside a shadow root, F8 again (or Escape) now takes focus back to the field it came from. Before, it stayed on the toast, because Toaster read `document.activeElement`, which is the shadow host there. Focus is now read through open shadow roots, both for the field F8 leaves and for where focus goes when a focused toast closes.
