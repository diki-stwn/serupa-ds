---
"serupa-ds": patch
---

`serupa-ds/stylelint` no longer flags names that happen to be colors, or lengths no token can express. `serupa/no-raw-color` now counts a named color only in a property that takes a color, so `grid-area: tan`, `animation-name: orange` and `font-family: Gold` pass. `serupa/no-raw-spacing` now passes percentages and viewport or container units, such as `inset: 50%` or `padding: max(var(--spacing-2), 1vw)`. Hex colors and color functions are flagged as before.
