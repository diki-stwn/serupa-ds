---
"serupa-ds": patch
---

TableActionBar: inside a shadow root, Clear (or an action that empties the selection) with focus in the bar moves focus to the table's "Select all", as on the page. Before, focus fell to the body, because the bar read `document.activeElement`, which is the shadow host there.
