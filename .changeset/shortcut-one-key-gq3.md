---
"serupa-ds": patch
---

KeyboardShortcuts: `useShortcut(["G", "I"])` ran on a lone I, since only its last key was matched, and the help dialog listed it as G + I. Keys that aren't one key plus its modifiers are now not set up or listed, with a development warning.
