---
"serupa-ds": patch
---

Docs: a "Build a page" guide lists what the page around the components sets (doctype and charset, `lang` and `dir`, a viewport that lets people zoom, a title per route, one `h1` and the landmarks, a skip link, focus after a route change, `theme.js` first, and preloading Inter's one variable file), with where each is shown. Getting started's plain-page sample now has a doctype, `<meta charset>`, a `<title>` and a `main`, links `components.css` instead of the 2 MB `bundle.css`, and preloads the font. Before you ship says to compress the files and serve them from a folder named for the version, cached for a year.
