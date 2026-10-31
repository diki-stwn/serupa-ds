---
"serupa-ds": minor
---

- Added: Drawer's `initialFocus` and `finalFocus`, as Dialog has: where focus lands when it opens, and where it goes when it closes (the next row, when the drawer deleted the one it was opened from).
- Fixed: a `modal={false}` Drawer taken off the page moved focus back to its opener even when people had moved on to the page; it now does that only when focus was inside it.
