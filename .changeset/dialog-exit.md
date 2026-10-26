---
"serupa-ds": patch
---

- Changed: Dialog fades and shrinks out over 150ms when it closes, with its backdrop, instead of vanishing (where the browser can keep it in the top layer: Chromium today). It enters with a transition rather than keyframes, so closing it mid-way turns back from where it is, and a Dialog open on arrival is shown from the first frame instead of fading in. Reduced motion: the fade alone.
