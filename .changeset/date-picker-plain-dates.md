---
"serupa-ds": minor
---

- Added: DatePicker's `value`, `defaultValue`, `min` and `max` take plain `"yyyy-mm-dd"` strings as that local day, and `onValueChange` gets the day as `"yyyy-mm-dd"` too, as its second argument. A Date at UTC midnight west of Greenwich, such as `new Date("2026-10-24")`, which shows the day before there, gives a console warning to pass the string instead.
