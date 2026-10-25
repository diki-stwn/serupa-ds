---
"serupa-ds": minor
---

- New component: Highlight. It marks the parts of a text that match a search in `<mark>`, ignoring case, accents and width the way Combobox matches ("lodz" marks "Łódź", "strasse" marks "Straße"), for search results, options and command palettes (idea 42). `words` marks each word of a query on its own, and `highlightRanges()` returns the matches as offsets.
