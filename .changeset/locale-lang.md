---
"serupa-ds": patch
---

Text written in a component's own `locale` (Calendar, DatePicker, DateRangePicker's calendars, TimePicker, NumberInput, FormattedNumber, RelativeTime) carries `lang` when that locale differs from the provider's, so screen readers read "Januari" in an Indonesian voice on an English page. Words from the labels (buttons, names) keep the page's language, and a `lang` you pass wins.
