---
"serupa-ds": minor
---

- Fixed: switching theme with theme.js no longer starts a transition on every control. A page of 20 rows started about 200 of them while the page surface switched at once, so the page changed color unevenly. Transitions are now off for two frames around the switch (`data-theme-switching`, read by tokens.css), so every color changes at once.
- Added: `withoutTransitions(change, element?)` does the same for apps that set `data-theme` on a section themselves.
