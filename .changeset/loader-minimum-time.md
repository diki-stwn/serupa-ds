---
"serupa-ds": minor
---

- Added: Loader `loading`. Keep the Loader mounted and pass `loading={false}` when the work ends. Once shown, it now stays at least 500ms, then renders nothing.
- Fixed: work that ended just after the 300ms delay flashed the loader for a frame or two, cut off mid fade-in.
