---
"serupa-ds": major
---

- **Breaking.** Removed (Badge): the press ripple on clickable badges, with its `.dk-badge__ripples` layer and the `--badge-ripple-opacity`, `--badge-ripple-duration` and `--badge-ripple-fade-duration` component tokens. **Migration:** there is no replacement; remove any of those tokens you set, and any styles aimed at `.dk-badge__ripple`. The press (shrink to 97%) stays as it was. The `motion-ripple` and `motion-ripple-fade` tokens stay, for ripples of your own.
- Changed (Badge): letting go of a press now comes back to size on `ease-enter` over `motion-release` (300ms), with no overshoot, as on Button.
- Changed (Badge): when loading starts, the content blurs a little (`blur-xs`) as it fades out and the ring sharpens from the same blur as it fades in, as on Button. Not under reduced motion.
