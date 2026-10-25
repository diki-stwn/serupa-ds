---
"serupa-ds": minor
---

Dialog: `fullScreen` fills the screen, either always (`true`) or only under 640px wide (`"mobile"`), with square corners, the footer at the bottom and padding that clears a phone's notch and home bar.

Fixed: under `<React.StrictMode>`, a Dialog or Drawer that was open on its first render dropped off the modal stack, so toasts and announcements stayed behind it on the inert page (A1).
