---
"serupa-ds": patch
---

- Fixed: an invalid ColorPicker (in a Field with an error, with `invalid`, or a required one submitted with nothing picked) now shows it on the swatches: their border takes the danger color, overridable with the new `--color-picker-invalid` token. Before, only the Field's message said so.
