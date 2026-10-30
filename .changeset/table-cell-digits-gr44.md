---
"serupa-ds": patch
---

- Fixed: a number given to `TableCell` as its child is written in the locale's digits, so `<TableCell>{318}</TableCell>` shows ٣١٨ under an ar-EG provider, as Badge and Pagination already do. It stays ungrouped, as given (1204 is still 1204 in en-US); for grouping, currency or units, pass `FormattedNumber`.
