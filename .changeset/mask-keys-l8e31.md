---
"serupa-ds": patch
---

- Fixed: a masked Input now runs your onKeyDown before its Backspace and Delete caret skip, so preventing the key there leaves the caret alone. The skip also waits while an input method is composing (L8E31).
