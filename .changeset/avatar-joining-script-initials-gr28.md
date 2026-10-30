---
"serupa-ds": patch
---

- Fixed: Avatar's initials in Arabic and other scripts whose letters join no longer join into a word. "محمد عبد الله" showed "ما" (the word "what"). The two initials are now kept apart with a zero-width non-joiner, so they show as two letters. This also applies to `initials()` and AvatarGroup (GR28).
