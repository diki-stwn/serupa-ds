---
"serupa-ds": patch
---

- Changed: Tooltip fades and slides back toward its element over 100ms as it hides, instead of vanishing (where the browser can keep it in the top layer: Chromium today). One handed over to the next tooltip during the warm-up still goes at once, so two never show together. Reduced motion: the fade alone.
