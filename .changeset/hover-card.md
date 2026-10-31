---
"serupa-ds": minor
---

Added: HoverCard, a preview of what a link points to (a person, a page, a record), shown when the pointer rests on the link or keyboard focus stays on it. Unlike a Tooltip it may hold links and buttons: the pointer can move onto it, and Tab goes from the link into it. It opens after 500ms (`openDelay`) and closes 300ms after the pointer and focus leave both (`closeDelay`); Escape closes it and, from inside, returns focus to the link. It fades and grows in like Popover, with ten component tokens. A touch screen has no hover, so it never opens there: the link goes to its page.
