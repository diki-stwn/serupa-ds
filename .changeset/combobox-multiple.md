---
"serupa-ds": minor
---

Combobox: `multiple` picks any number of options. Each picked option is a removable tag (a Badge) before the text, the listbox is `aria-multiselectable`, picking toggles an option and keeps the list open, Backspace in the empty field removes the last tag, each pick and removal is read out (the new `valueAdded` and `valueRemoved` labels), and `name` sends one hidden input per value. `value`, `defaultValue` and `onValueChange` use `string[]` with `multiple`. `ComboboxProps` is now `ComboboxSingleProps | ComboboxMultipleProps`; for Storybook's `Meta`, type the component as `ComboboxSingleProps` (as Button's stories do).
