---
"serupa-ds": patch
---

Fixed (Button): the package loads under Preact (`preact/compat`). Button imported React 19's `useFormStatus` by name, which Preact doesn't have, so importing `serupa-ds` failed there; it now reads it if it's there, and a submit button there is only loading when you set `loading`.
