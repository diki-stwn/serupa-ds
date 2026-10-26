---
"serupa-ds": patch
---

- Fixed: an invalid Rating (in a Field with an error, or with `invalid`) now shows it on the stars: the empty ones take the danger color, overridable with the new `--rating-invalid` token. Before, only the Field's message said so.
