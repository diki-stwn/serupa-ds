---
"serupa-ds": patch
---

`theme.js` reads the saved theme again when a page comes back from the back/forward cache, so a theme picked in another tab while the page sat there is applied on return, also in a browser that doesn't deliver that storage event to a cached page.
