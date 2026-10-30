---
"serupa-ds": minor
---

- Added: `theme.js` keeps `<meta name="theme-color">` on the page's surface, so on phones the status bar and the browser's address bar change with light and dark mode in all six themes. Before the stylesheets arrive it uses the token values (white, zinc-950); after, the body's own background, so a page that changes `--surface` gets its own colour. A `theme-color` meta the page writes itself is left as it is.
