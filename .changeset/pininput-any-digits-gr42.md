---
"serupa-ds": patch
---

- Fixed: PinInput keeps digits typed on an Arabic, Persian or Bengali keyboard, or full width from a Japanese or Chinese IME. It dropped them as "not a digit", so someone typing ٤٥٦٧ saw nothing happen. They're now read as the ASCII digits they stand for, so the value is still 0–9 (GR42).
