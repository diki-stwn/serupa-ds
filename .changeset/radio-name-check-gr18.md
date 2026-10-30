---
"serupa-ds": patch
---

- Fixed: Radio warns in development when it has no accessible name (no label and no aria-label), like Checkbox and Switch already did (GR18).
- Fixed: Radio, Checkbox and Switch warn in development when given `label`. It isn't one of their props, so it landed on the `<input>` as an attribute and named nothing. Put the text in `children` (GR18).
