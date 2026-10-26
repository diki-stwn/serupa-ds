---
"serupa-ds": patch
---

List: an `aria-current` in a ListItem's `linkProps` is kept. Before, the item always set its own (`"true"` when `selected`, none otherwise), so `linkProps={{ 'aria-current': 'page' }}` never reached the link.
