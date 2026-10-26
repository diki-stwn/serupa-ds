---
"serupa-ds": minor
---

- Fixed: switching theme with theme.js no longer starts a transition on every control. A page of 20 rows started about 200 of them while the page surface switched at once, so the page changed color unevenly. The switch now finishes each color transition at once, so every color changes together, while motion runs on: a menu picked from fades out and a dark-mode Switch slides.
- Added: `withoutColorTransitions(change, element?)` does the same for apps that set `data-theme` on a section themselves.
