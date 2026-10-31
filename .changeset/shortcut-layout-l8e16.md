---
"serupa-ds": patch
---

- Fixed: useShortcut matched a letter by its key's position even when the key typed another Latin letter, so on AZERTY Ctrl+A (the key in Q's place) could run a Ctrl+Q shortcut, and on Dvorak most letter shortcuts collided. A letter now matches by position only when the key types no Latin letter (Option on a Mac, a Cyrillic or Greek layout).
