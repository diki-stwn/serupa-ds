---
"serupa-ds": minor
---

- Added: ColorPicker takes `required` and `invalid`. A required picker with no color stops the form submitting, marks the swatches invalid and focuses them (AJ2).
- Fixed: a ColorPicker in a Field gave the Field's id to both its outer element and its hex field, and put `aria-describedby` and `aria-required` on an element with no role. The radiogroup now carries the description, `aria-required`, `aria-invalid` and `aria-errormessage`, and the hex field stays a separate field named "Hex code" (AK2).
