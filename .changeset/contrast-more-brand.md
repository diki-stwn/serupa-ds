---
"serupa-ds": minor
---

More contrast now raises the brand color too, in each brand's own hue: under `data-contrast="more"` (or the system's more-contrast setting), `primary` takes brand 800 in light themes and brand 300 in dark, `primary-hover` brand 900 / 200, and `focus-ring` brand 700 / 300. Links, secondary button labels and the text on a primary fill reach 7:1 in all six themes, from `data-theme`, from the `data-brand` / `data-mode` axes and in nested brand sections. A `contrastMore` in tokens.json can now hold a value per theme, which the token build writes as an internal `--dk-more-*` token beside each theme's colors.
