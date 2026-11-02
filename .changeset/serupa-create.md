---
"serupa-ds": minor
---

Added: `serupa-create` starts a new app with Serupa set up. `npx --package=github:diki-stwn/serupa-ds#v<version> serupa-create my-app` makes a React, Vite and TypeScript app that installs the same release, loads the stylesheets in order, runs `theme.js` first in the page so there's no flash of the wrong theme, has a skip link, a main landmark and a theme switch, and trims the CSS in `npm run build`. `--brand violet` or `--brand emerald` picks the brand.
