---
"serupa-ds": minor
---

- **Changed:** `data-contrast="more"` (and `prefers-contrast: more`) now raises the status colors. `success-text`, `warning-text`, `danger-text` and `info-text` move to hue-900 in light themes and hue-200 in dark ones. That gives 7:1 on `surface`, `surface-raised` and the status's own subtle fill, so error messages and alert text meet WCAG AAA like body text. The `success`, `warning` and `info` icon colors move to hue-700 (info sky-800) in light and hue-300 in dark. `danger` keeps its fill, because white `on-danger` text sits on it. Normal contrast doesn't change. Brand-colored text and subtle badge labels are not raised yet.
