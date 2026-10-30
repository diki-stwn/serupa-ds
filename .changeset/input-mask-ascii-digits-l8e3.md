---
"serupa-ds": patch
---

- Fixed: an Input with a mask keeps digits typed on an Arabic-Indic or full-width keyboard as 0-9 in its value, so a card number typed as ٤٢٤٢ or ４２４２ submits 4242 (L8E3).
