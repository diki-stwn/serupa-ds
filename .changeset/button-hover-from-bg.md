---
"serupa-ds": minor
---

Button: a primary button given its own `--button-primary-bg` and no `--button-primary-bg-hover` now gets a hover color worked out from its background, with CSS relative color syntax: a step darker in light themes and lighter in dark ones, in the same hue. Before, it hovered in the theme's brand color. A hover color you set, and buttons with no background of their own, are unchanged.
