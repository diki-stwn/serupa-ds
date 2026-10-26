---
"serupa-ds": minor
---

Added: `motion-release` (300ms), the time a press let go takes to spring back.

Changed: a press now springs back. Button, Badge, Card, Checkbox, Radio, Switch, SegmentedControl and Stepper still shrink in 100ms while held (`motion-press` with `ease-settle`), and on release they spring back to size with a real spring (`ease-spring`, over `motion-release`) that overshoots a touch and settles, instead of easing straight back. Nothing to change in your code; `--button-press-duration` and `--badge-press-duration` still time the press itself. Under reduced motion nothing scales, as before.
