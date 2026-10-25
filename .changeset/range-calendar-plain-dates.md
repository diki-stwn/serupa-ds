---
"serupa-ds": minor
---

- Added: DateRangePicker and Calendar take plain `"yyyy-mm-dd"` strings for their value, default value, min and max, as DatePicker does. `onValueChange` also gets the day or range as `"yyyy-mm-dd"` in its second argument. A new type, `DateRangeInput`, is the range they take.
