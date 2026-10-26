---
"serupa-ds": minor
---

- Added: Toast `autoDismiss` option. Every toast goes by itself after its duration unless `autoDismiss: false`, which keeps it until it's closed, for a message someone has to act on. `duration: 0` still keeps a toast up too.
- Added: `<Toaster duration autoDismiss>` set the time and whether toasts go by themselves for the whole app; a toast's own options win.
- Changed: A toast with an action now goes after 5 seconds like any other, rather than staying until closed. Its time still stops while it's hovered or focused (F8 reaches it). Pass `autoDismiss: false` to keep the old behaviour.
