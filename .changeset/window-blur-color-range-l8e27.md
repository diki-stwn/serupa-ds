---
"serupa-ds": patch
---

- Fixed: switching to another window or browser tab while typing in ColorPicker's hex field or a DateRangePicker field treated the half-typed text as finished: the hex went back to the current color, and a partial date was rejected with `onInvalidInput` and cleared. The text now waits until people actually leave the field, as in Combobox, DatePicker, TimePicker and NumberInput.
