---
"serupa-ds": patch
---

- Fixed: PhoneInput reads digits typed on an Arabic, Persian or Bengali keyboard, or full width from a Japanese or Chinese IME (and a full-width "＋"). It dropped them, so someone in Egypt typing ٠١٠… saw nothing entered. They're now read as the ASCII digits they stand for, and the E.164 value is unchanged (GR43).
