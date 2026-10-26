---
"serupa-ds": patch
---

- Changed: Image's loading placeholder no longer pulses the whole frame's opacity (which also faded the remove button). A lighter band sweeps through the placeholder fill every 2s with `ease-move` (ease-in-out), the same look and timing as Loader's skeleton, on `translate`, which the compositor runs. Right to left it sweeps from the right. With reduced motion or forced colors the fill is still. New token: `--image-shine` (default `surface`).
