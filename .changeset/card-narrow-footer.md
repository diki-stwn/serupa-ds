---
"serupa-ds": patch
---

Card: in a narrow card (its footer under 20rem, as on a phone), each footer action now takes the full row, one under the other, instead of squeezing side by side. It follows the footer's own width like a container query, without making Card a size container, so a card sized by its content keeps its size. Wider cards are unchanged.
