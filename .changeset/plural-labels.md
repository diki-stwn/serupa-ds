---
"serupa-ds": minor
---

New `plural(locale, count, forms)` export: picks the words for a count with `Intl.PluralRules` (`one`, `few`, `many`, … and `other`) and writes the count the locale's way where the words have `#`, for count labels in languages with more than two plural forms, such as Russian and Arabic. Localization docs show it with a Russian `resultsCount`.
