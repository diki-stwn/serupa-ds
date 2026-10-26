---
"serupa-ds": patch
---

- Changed: Popover fades and shrinks back over 100ms when it closes, instead of vanishing (where the browser can keep it in the top layer: Chromium today), with its content kept, inert, until the fade ends. It enters with a transition rather than keyframes, so closing it mid-way turns back from where it is, and a Popover open on arrival is shown from the first frame. Reduced motion: the fade alone.
