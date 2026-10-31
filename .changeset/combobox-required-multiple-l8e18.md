---
"serupa-ds": patch
---

- Fixed: a required Combobox with `multiple` blocked its form even with tags picked, since the native check looked at the empty text field. It now passes once a tag is picked, and is still announced as required.
