---
"serupa-ds": minor
---

- Added: `toast.undo({ title, commit, onUndo })` for the undo pattern. It shows a toast with an Undo button and runs `commit` once, when the toast closes without Undo (its time runs out, it's closed, or the page is left), or `onUndo` if Undo is chosen. There is a new `undo` label.
