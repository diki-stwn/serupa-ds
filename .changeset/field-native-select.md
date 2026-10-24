---
"serupa-ds": patch
---

- Fixed: a native `<select>` as Field's direct child got no id, hint, error or invalid state, and the label pointed at an id nothing had, because its options made Field treat it as a wrapper. Labelable elements (select, button, meter, output, progress, textarea) are always the control now (S1).
- Fixed: Field's "(optional)" was English in every language. It's the new `fieldOptional` label now ("(opsional)" in `idLabels`) (S2).
- Fixed: an error that appears on a Field after mount (after a submit, say) wasn't announced, since a description is only read on focus. Field now says it politely when it appears or changes (S3).
- Added: Field warns once in the console when nothing on the page has its control's id, so the label names nothing (A4).
- Fixed: the shared screen reader announcer relied on the `sr-only` utility class, so without `utilities.css` its text showed on the page. It's hidden with inline styles now (A2).
