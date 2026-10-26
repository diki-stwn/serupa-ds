---
"serupa-ds": patch
---

- Fixed: pressing Pagination's next arrow on the second-to-last page, or Calendar's month arrow into the month holding `min` or `max` (in DatePicker and DateRangePicker too), disabled the arrow under focus, so focus fell to the top of the page and keyboard and screen reader users lost their place. Focus now moves to the other arrow, as Carousel's arrows do.
