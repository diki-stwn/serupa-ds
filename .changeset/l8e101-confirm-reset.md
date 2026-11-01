---
"serupa-ds": patch
---

- Fixed: TypeToConfirm kept what was typed when the Dialog or Drawer around it closed (it stays mounted) or its form reset, so on reopening the destructive button already worked. It now clears.
