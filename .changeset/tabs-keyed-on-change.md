---
"serupa-ds": patch
---

Tabs: after an arrow, Home or End picked a tab, a controlled value set by a mouse click elsewhere (a Next button, say) made the line or fill jump instead of slide. Tabs now works out whether the last input was a key each time the value changes, as SegmentedControl does, so only a keyboard pick moves it at once.
