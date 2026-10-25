---
"serupa-ds": minor
---

- Fixed: Combobox, DatePicker, DateRangePicker, PhoneInput, SegmentedControl, Slider and TimePicker placed outside their form with `form="…"` sent nothing, because their hidden inputs didn't carry the form attribute. They do now, and a reset of that form puts their defaults back (U3).
- Added: `form` on Slider, SegmentedControl and DateRangePicker, which render no input of their own to take it.
