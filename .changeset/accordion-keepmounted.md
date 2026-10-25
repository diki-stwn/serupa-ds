---
"serupa-ds": minor
---

- Added: `keepMounted` on AccordionItem, as on TabPanel. `keepMounted={false}` renders an item's content only while it's open (and while it closes), for heavy content such as a chart. By default closed content stays in the page and keeps its state.
