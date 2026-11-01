---
"serupa-ds": patch
---

- Fixed: a required field in a closed AccordionItem stopped the form's submit with nothing shown, since the browser can't point at a hidden field. The item now opens, the field takes focus and the browser says what's missing.
