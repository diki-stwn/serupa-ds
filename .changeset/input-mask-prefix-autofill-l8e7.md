---
"serupa-ds": patch
---

- Fixed: a masked Input with a leading prefix ("+62 999-9999-9999") reads an autofilled or pasted "+6281234567890" or "+62-812…" as 812…, instead of taking the prefix's 6 and 2 as typed digits (L8E7).
