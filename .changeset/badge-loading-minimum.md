---
"serupa-ds": patch
---

- Fixed: a Badge whose `loading` ended a moment after it started flashed the ring for a frame or two. Once shown, the ring now stays at least 500ms.
- Fixed: a Loader with `delay={0}` now shows in the same render that turns `loading` on, not one frame later.
