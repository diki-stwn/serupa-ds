---
"serupa-ds": minor
---

Changed: Combobox draws at most 100 option rows at once, so typing into lists of thousands stays quick. A muted "Keep typing to narrow N more" line shows how many more match. It uses the new `moreResults` label, with English and Indonesian text. Every row's `aria-posinset` and `aria-setsize` still count all the matches, and the picked option is drawn even when it's further down.
