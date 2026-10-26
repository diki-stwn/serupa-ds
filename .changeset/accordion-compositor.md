---
"serupa-ds": patch
---

- Changed: Accordion no longer animates its height (grid-template-rows), which laid the page out on every frame. Opening, the content takes its height at once and unfolds over it with a fade and an opening clip (200ms, ease-enter); closing, it keeps its height while it fades and folds back (150ms, ease-exit), then gives it up. Both are transitions, so a quick second press turns back from where it is. With reduced motion it fades instead of opening at once.
