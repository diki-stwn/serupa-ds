---
"serupa-ds": minor
---

Added: `serupa-ds/eslint`, an ESLint flat-config object that tells eslint-plugin-jsx-a11y (and its fork eslint-plugin-jsx-a11y-x) what each component renders, so a project's lint checks `<Image>`, `<Link>` and `<IconButton>` as it checks `img`, `a` and `button`. Add it after the plugin's config in `eslint.config.js`. Getting started shows how, and how to use the same settings with Oxlint.
