---
"serupa-ds": minor
---

Combobox:
- PageDown and PageUp move by what the list shows at once (about seven options), as the ARIA pattern describes. Before, they jumped to the last and first option, the same as End and Home (BH1).
- The list is at most 28rem wide unless the field is wider, and long labels wrap. Before, one long label could stretch it to the width of the window. New token `--combobox-listbox-max-width` (BH2).
- When typing stops, the number of matching options is announced ("3 results"). New label `resultsCount`, in English and Indonesian (BE1).
- An option's text `description` is now its `aria-description`, so its name is the label alone. `aria-controls` is set only while the list is open (N8).
