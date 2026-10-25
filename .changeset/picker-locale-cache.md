---
"serupa-ds": patch
---

DatePicker, DateRangePicker and TimePicker work out the locale's date order, typing pattern and 12-hour clock once per locale instead of on every render and keystroke. NumberInput works out its percent scale once per locale and format.
