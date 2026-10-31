---
"serupa-ds": minor
---

- **Added:** `serupa-ds/stylelint`, a Stylelint config for an app's own CSS. Extend it with `extends: ["serupa-ds/stylelint"]`. It turns on three rules: `serupa/no-raw-color` flags a color written out (`#333`, `rgb()`, `oklch()`, a named color), `serupa/no-raw-spacing` flags a length in margin, padding, gap or inset, and `serupa/no-raw-radius` flags a length in border-radius. Each message names the token family to use. Values inside `var()`, `calc()` over tokens, `0`, `transparent`, `currentcolor` and custom properties pass. `stylelint` 16 or later is an optional peer dependency, needed only when you use the config.
