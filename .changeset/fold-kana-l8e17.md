---
"serupa-ds": patch
---

- Fixed: Combobox, Highlight and Menu/TreeView typeahead treated hiragana and katakana as different, so "こーひー", as a Japanese IME types it before conversion, didn't find "コーヒー". They now match, as Japanese search does; a voicing mark still makes another word ("カス" isn't "ガス").
