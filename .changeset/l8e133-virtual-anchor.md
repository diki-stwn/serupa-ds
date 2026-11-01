---
"serupa-ds": patch
---

VirtualList: after a jump to the middle of a long list, a small scroll no longer moves the view dozens of rows; the row at the top of the view stays put while the rows around it are measured (GR93). Past the browser's height limit (about 270,000 rows), the arrow and Page keys and the wheel step through the rows as in a short list instead of skipping 20 or more rows at a time (GR94). Tabbing through rows of links scrolls each into view again; it used to be pulled back to the top.
