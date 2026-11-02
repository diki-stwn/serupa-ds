---
"serupa-ds": patch
---

ErrorBoundary: inside a shadow root, Try again (or a custom fallback's `reset()`, or `resetKeys`) with focus in the fallback moves focus to what came back, as on the page. Before, focus fell to the body, because ErrorBoundary read `document.activeElement`, which is the shadow host there. Focus is now read through open shadow roots.
