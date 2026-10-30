---
"serupa-ds": major
---

- **Breaking.** Removed (Button): the press ripple, with its `.dk-btn__ripples` layer and the `--button-ripple-opacity`, `--button-ripple-duration` and `--button-ripple-fade-duration` component tokens. **Migration:** there is no replacement; remove any of those tokens you set, and any styles aimed at `.dk-btn__ripple`. The press (shrink to 97%) stays as it was.
- Changed (Button): letting go of a press now comes back to size on `ease-enter` over `motion-release` (300ms), with no overshoot; before, it sprang back on `ease-spring` and went about 9% past full size.
- Changed (Button): when loading starts, the label and icons blur a little (`blur-xs`) as they fade out and the spinner sharpens from the same blur as it fades in, so the two read as one change. Not under reduced motion.
