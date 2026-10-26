---
"serupa-ds": minor
---

Added: `withViewTransition(update, { types? })` runs a state change as a View Transition, so what it moves glides to its new place instead of jumping, like a list reordered or filtered, a card expanded, or a layout switched. React state set inside it is flushed before the browser takes its "after" picture. Where View Transitions are missing, the change just happens.

Added: `base.css` times every View Transition with `motion-change-md` and `ease-move`, and under reduced motion only crossfades, so nothing travels. That covers your own `document.startViewTransition()` calls too.

Added: the utility classes `view-transition-match` (`view-transition-name: match-element`, so each element travels as itself) and `view-transition-none`.
