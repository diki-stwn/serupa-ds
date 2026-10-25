---
"serupa-ds": minor
---

- Added: PhoneInput knows every calling code in the world (244 countries and territories, up from 51). `+94 77…` is Sri Lanka now, where the digits used to be read as a number in the picked country (K2).
- Added: where countries share a calling code, the area picks one. `+1 416…` is Canada and `+1 684…` American Samoa (both read as the US before), `+7 7…` is Kazakhstan, and `+44 1481…` is Guernsey. `PhoneCountry` has optional `areas` and `patterns`.
- Added: `countries` takes your own `PhoneCountry` rows as well as ISO codes; a row replaces the built-in one with the same code. `parsePhone` takes the list as a third argument.
- Added: a `+` code PhoneInput doesn't know warns once in the console.
- Fixed: a calling code typed without `+` ("62 812…" with Indonesia picked) was written twice (+6262…). It's dropped once the number is too long to be a national one (R33).
- Fixed: German numbers are grouped by their area code. "030 123456" is "30 123456", not "301 23456" (R34). Tokyo, Osaka and London group by their area code too.
