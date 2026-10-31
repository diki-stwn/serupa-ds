---
"serupa-ds": patch
---

- Fixed: a MenuItem's `onSelect` that moved focus itself (to the next row, after deleting the one the menu belongs to) had focus taken back to the menu's button, which the delete then removed, so focus fell to the top of the page. Focus now stays where `onSelect` put it.
