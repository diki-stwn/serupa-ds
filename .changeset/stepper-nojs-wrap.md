---
"serupa-ds": patch
---

Stepper: before the script runs (server HTML ahead of hydration, or with JavaScript off), a horizontal Stepper on a narrow screen no longer squeezes its titles to one letter a line. Until it can measure, a title on a phone is never narrower than its longest word, and a row that still doesn't fit scrolls in its own box. Once mounted, it switches to compact as before. Wider screens are unchanged, so nothing moves when the script takes over.

Stepper also fits its titles again when web fonts finish loading. Titles drawn first in the fallback font change width when Inter arrives, and the row stayed full with titles broken mid-word, since its own width never changed (GR65).
