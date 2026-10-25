---
"serupa-ds": minor
---

Input, NumberInput, PasswordInput, PhoneInput, SearchInput, Combobox, DatePicker, TimePicker, Textarea, Image and Divider no longer accept `children` in their types. They render an element that can't hold children (an `<input>`, `<img>` or `<hr>`; a `<textarea>` takes its text from `value`), so `<Input>text</Input>` type-checked and then threw in React. If your code passed children to one of these, move that text to `value`, `defaultValue`, `label` or a wrapper.
