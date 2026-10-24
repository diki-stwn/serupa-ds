---
"serupa-ds": patch
---

- Fixed: typing an option's full label in Combobox ("Brazil") and then leaving the field emptied it and picked nothing. Text that is exactly one enabled option's label (any case, with or without accents) now picks that option when focus leaves (N1).
- Fixed: Combobox's chevron and × names ("Show options", "Clear Country") and a range Slider's thumb names ("Minimum", "Maximum") were English in every language. They're labels now (`showOptions`, `clearValue`, `sliderMinimum`, `sliderMaximum`), Indonesian in `idLabels` (A5).
