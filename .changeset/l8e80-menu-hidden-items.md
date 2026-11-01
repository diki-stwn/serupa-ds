---
"serupa-ds": patch
---

- Fixed: Menu and ContextMenu skip an item hidden by CSS or the `hidden` attribute. Before, opening the menu or pressing an arrow, Home or End could aim focus at it, and focus stayed stuck where it was.
