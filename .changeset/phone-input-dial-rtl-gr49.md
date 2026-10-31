---
"serupa-ds": patch
---

PhoneInput: in a right-to-left page the calling code now reads "+20", not "20+", both in the prefix and in each country's option ("مصر (+20)"). The prefix is isolated left to right, and the options carry the code in a left-to-right isolate (U+2066 … U+2069).
