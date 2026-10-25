---
"serupa-ds": minor
---

Tabs: the browser's find-in-page now finds text on other tabs. A kept panel of another tab is `hidden="until-found"`, so a match selects its tab (calling `onValueChange`) and shows it, as Accordion opens an item. Browsers without `until-found` keep it plainly hidden, as before.
