---
"serupa-ds": patch
---

- Fixed: DatePicker, DateRangePicker and Calendar read an ISO date and time as an API sends it ("2026-10-24T00:00:00Z", "2026-10-24 09:30:00") as the day it writes, instead of showing nothing; a development warning (`datetime-string`) says to pass the "yyyy-mm-dd" day (L8E10).
