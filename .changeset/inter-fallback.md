---
"serupa-ds": minor
---

Text no longer jumps when Inter loads. `--font-sans` is now `Inter, "Inter Fallback", ui-sans-serif, system-ui, sans-serif`, and `tokens.css` defines "Inter Fallback" as Arial (or Helvetica, Liberation Sans, Arimo, whichever the device has), sized with `size-adjust` so a line of English is within about 1% of its width in Inter, and with Inter's ascent and descent. Until Inter arrives (`font-display: swap`), text draws in that font. When Inter swaps in, lines keep almost the same width and height, so the page below them doesn't move. It covers the latin range only, so other scripts fall back to the system font as before. Nothing changes once Inter has loaded.
