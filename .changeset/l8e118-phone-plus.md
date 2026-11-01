---
"serupa-ds": patch
---

- Fixed: PhoneInput keeps a calling code typed key by key ("+44 …", or "0044 …" in Germany) in the field until it names a country, then picks that country, as a pasted number does. Before, the lone "+" was dropped, so "+44 20 7946 0958" was sent as a wrong US number.
