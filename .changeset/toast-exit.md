---
"serupa-ds": patch
---

- Changed: a closing toast fades and slides back toward its edge over 150ms instead of vanishing, inert while it goes, and the toasts left glide to their new place over 200ms instead of jumping (FLIP, on translate; at once with reduced motion). Toasts enter with a transition rather than keyframes, and ones there as the Toaster arrives are shown from the first frame. Reduced motion: toasts only fade.
