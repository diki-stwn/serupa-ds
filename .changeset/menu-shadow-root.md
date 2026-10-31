---
"serupa-ds": patch
---

Menu: inside a shadow root, ArrowDown and ArrowUp now move from the item that has focus. Before, every press went back to the first item, because Menu read `document.activeElement`, which is the shadow host there. Hovering an item, choosing one, and where a ContextMenu returns focus also read the menu's own root now.
