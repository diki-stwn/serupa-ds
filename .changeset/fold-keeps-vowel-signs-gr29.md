---
"serupa-ds": patch
---

- Fixed: Combobox filtering, Highlight and typeahead no longer treat different words in Hindi, Bengali, Tamil, Thai or Japanese as the same. Matching dropped every combining mark, so typing "कम" also matched "काम", "ไข่" matched "ไข้" and "カス" matched "ガス". Now only accents are ignored, the same as before for Latin, Greek, Vietnamese, Arabic and Hebrew. Vowel signs, tone marks and Japanese voicing marks are kept (GR29).
