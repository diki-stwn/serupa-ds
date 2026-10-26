---
"serupa-ds": minor
---

theme.js: switching the theme changes every color at once. Before, each control faded to its new colors on its own 150ms transition while the page surface switched at once, and the cost grew with the page. A switch now sets `data-theme-switching` on the root for two frames, and tokens.css turns transitions off under it. You can set the attribute yourself around a section's own `data-theme` change.
