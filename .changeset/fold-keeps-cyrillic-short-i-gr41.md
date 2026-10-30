---
"serupa-ds": patch
---

- Fixed: Combobox filtering, Highlight and typeahead keep Cyrillic й, ў and ї apart from и, у and і. Matching dropped their marks as if they were accents, so typing "мои" also found "мой" and "Киів" found "Київ". "ё" still finds "е", the way people type it (GR41).
