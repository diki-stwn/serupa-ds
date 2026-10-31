---
"serupa-ds": minor
---

Navbar: a `sticky` bar now lifts once the page scrolls under it. A shadow fades in over the first bar height of scroll, driven by the scroll itself (a scroll-driven animation) rather than a timer, so it follows the page exactly and never runs on its own. Set `--navbar-shadow-scrolled` to change it (default `shadow-md`), or `none` to keep the flat bar. Where scroll-driven animations aren't supported (Firefox), the bar keeps its line alone, as before.
