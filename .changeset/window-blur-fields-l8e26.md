---
"serupa-ds": patch
---

- Fixed: switching to another window or browser tab while typing in a Combobox, DatePicker, TimePicker or NumberInput (to copy something, say) treated the half-typed text as finished: the window losing focus blurs the field, so a partial date, time or number was rejected with `onInvalidInput` and put back, and Combobox put back the picked label. The text now waits until people actually leave the field.
