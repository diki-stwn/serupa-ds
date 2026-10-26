---
"serupa-ds": patch
---

- Fixed: Toast stacks no longer jump when a toast is pushed into the waiting line. At the top of the screen, the toast that was pushed out was put back at its old place in the list, ahead of the one it had been under; that toast faded in again and dropped below it, then jumped back. Each leaving toast now stays after the one it followed.
- Changed: A toast pushed into the waiting line shrinks and fades toward the "+N more" line instead of sliding off like a closed one. That line now fades in and out and glides with the toasts, rather than appearing at once and jumping when the pushed-out toast goes.
- Fixed: Toasts close in the order they came. A toast that had been shown and was pushed into the waiting line started its whole duration again when it came back, so the oldest closed last. Its time now keeps running while it waits; one that was never shown still waits with its time stopped.
- Fixed: Closing a toast with the mouse no longer moves focus to the toast next to it. That focus stopped the other toast's time, so it stayed until you clicked elsewhere. Closing with the keyboard still hands focus on.
