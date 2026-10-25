---
"serupa-ds": patch
---

- Fixed: NumberInput read an accounting negative, "(Rp 1.500)" from `currencySign: "accounting"`, or a trailing minus ("1234.5-") back as a positive number on blur, a silent sign flip. Both are negative now (AA1).
- Fixed: with `style: "unit"`, Thai, Nepali and Tamil unit abbreviations hold dots ("กม."), and NumberInput refused the text it had just written. Dots in the text around the number are fine now (AA2).
- Fixed: Chinese numerals (`zh-u-nu-hanidec`, 二〇二五) typed into number, date and time fields are read (AB1).
