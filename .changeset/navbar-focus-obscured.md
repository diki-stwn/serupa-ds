---
"serupa-ds": patch
---

Fixed: with a sticky Navbar, a field reached with Tab, or the target of a `#link`, could scroll into view under the bar and stay hidden (WCAG 2.4.11 Focus Not Obscured). The page's `scroll-padding-top` now follows the bar's height, so they land just below it.
