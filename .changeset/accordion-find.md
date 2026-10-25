---
"serupa-ds": minor
---

- Added: find-in-page reaches closed Accordion items. Ctrl+F (⌘F) used to skip them; now the browser finds the text and opens the item it's in, through `hidden="until-found"` (idea 186). Closed content is still out of the tab order and hidden from screen readers.
- Added: `showExpandAll` on Accordion with `type="multiple"`: an "Expand all" button above the items, which becomes "Collapse all" once every item is open. New `expandAll` and `collapseAll` labels, in English and Indonesian (idea 52).
