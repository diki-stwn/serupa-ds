---
"serupa-ds": minor
---

Public types: every component prop has its own description on hover (40 props had none, mostly the second of a pair such as `nextLabel`, `max` and `endLabel`, and pass-throughs such as `href`, `target` and `disabled`). Calendar's four props for DateRangePicker are no longer in the public types, so they don't autocomplete. `TabListProps`, `TableHeadProps`, `TableBodyProps`, `TableFootProps` and `MenuSeparatorProps` are exported like every other part's props. A new check, `tools/test/public-docs.mjs`, keeps all three that way.
