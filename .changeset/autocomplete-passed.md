---
"serupa-ds": patch
---

- Fixed: DatePicker, TimePicker and Combobox keep an `autoComplete` you pass, such as `bday` for a date of birth or `country-name` for a country, so browsers can fill them (WCAG 1.3.5). They wrote `off` over it. `off` stays the default.
