---
"serupa-ds": patch
---

- Changed: Drawer slides back out to its edge over 200ms when it closes, with its backdrop fading, instead of vanishing (a modal drawer where the browser can keep it in the top layer, Chromium today; a non-modal one everywhere). It slides in with a transition rather than keyframes, so closing it mid-way turns back from where it is; a swipe let go short slides back instead of jumping, and a Drawer open on arrival is shown from the first frame. Reduced motion: the panel fades instead of sliding.
