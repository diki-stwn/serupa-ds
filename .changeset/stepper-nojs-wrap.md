---
"serupa-ds": patch
---

Stepper: before the script runs (server HTML ahead of hydration, or with JavaScript off), a horizontal Stepper on a narrow screen no longer squeezes its titles to one letter a line. Until it can measure, a title is never narrower than its longest word, and steps that don't fit wrap onto another row. Once mounted, it switches to compact as before.
