---
"serupa-ds": patch
---

- Fixed: A required Field group was not read as required. The `*` is hidden from screen readers and a fieldset can't carry `aria-required`, so `<Field group required label="Contact by">` was announced with no mention of it. The legend now says "Required" in words, hidden from sight (the `required` label), so the set is read as "Contact by, Required" whatever it holds.
