---
"serupa-ds": minor
---

- Added: DatePicker, DateRangePicker and TimePicker describe their fields with the format to type ("Format: mm/dd/yyyy"), after a Field hint, so screen readers say it even once the placeholder is gone. The words are a new `formatHint` label, in English and Indonesian.
- Changed: TimePicker's placeholder follows the locale's order, separator and AM/PM words, worked out with formatToParts: "hh:mm AM/PM" in en-US, "hh.mm" in id-ID, "오전/오후 hh:mm" in ko. It was "hh:mm am" or "hh:mm" everywhere.
