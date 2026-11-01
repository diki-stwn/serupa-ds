---
"serupa-ds": patch
---

- Fixed: Tabs, pressing the tab that's already selected (a click, Enter or Space) no longer calls onValueChange with the same value, which pushed the same page into the history again in an app that keeps the tab in the URL.
