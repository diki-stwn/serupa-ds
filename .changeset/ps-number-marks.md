---
"serupa-ds": patch
---

NumberInput and the other number fields read typed numbers in Pashto and Uzbek (Arabic script) correctly. With Latin digits these locales write 1.234,5, but the fields took the marks from their Arabic-Indic digits and read "1.234" as not a number.
