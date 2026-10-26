---
"serupa-ds": patch
---

- Changed: one spinner across the library (EE1). Loader's ring is now a quarter arc on its track that turns once a second (`motion-loop-spinner`, `ease-linear`), instead of an arc that grew and shrank as it turned every 2s. Only the drawing turns, so nothing is repainted on each frame. Button, IconButton, Fab, Badge and SearchInput use it. Switch's pending ring now looks the same (a quarter arc on a faint track of its color) and turns at the same speed, as the indeterminate circular Progress already did.
- Changed: under reduced motion, spinners no longer turn. Loader's ring and spokes, Switch's pending ring and the indeterminate circular Progress stand still and breathe between full and half strength over 2s. Button's and Badge's spinner only fades in, without growing.
