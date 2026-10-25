---
"serupa-ds": patch
---

- Fixed: a loading Button or Badge, or a disabled Button with a `disabledReason`, swallowed the click for everything above it, so a parent's onClick, an analytics wrapper or a Card's stretched link never heard it. It still does nothing itself (no submit, no navigation), and the click now bubbles (A6).
