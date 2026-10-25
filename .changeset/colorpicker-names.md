---
"serupa-ds": minor
---

- Changed: a ColorPicker swatch given as a bare hex string is now read out by a name from its color ("Dark blue", "Light gray") instead of its code ("#1e3a8a"), with the code as its tooltip. The words come from the new `colorName` label, in English and Indonesian (idea 207).
- Added: with `contrastWith`, every swatch says its contrast ratio before it's picked, and one under `minContrast` is struck through and has `data-low-contrast`, so people see which colors are hard to read before choosing (idea 208).
- Added: `onValueCommit` on ColorPicker, called once a color is chosen (a swatch, the browser's picker closing, or leaving the hex field), not on every drag step like `onValueChange` (K7).
- Fixed: a form reset left ColorPicker on the last color and submitted it. It goes back to `defaultValue` now (P2).
- Added: `form` submits the color with a form the picker sits outside of, and that form's reset puts the first color back (U3).
- Fixed: a controlled ColorPicker whose parent turned down a typed color kept the rejected text in its hex field. On blur the field shows the color it kept (AF2).
