---
"serupa-ds": major
---

- **Breaking.** Removed (Badge): the last of the `size` prop, which 4.0.0 removed. Badge no longer holds it back or warns about it (the `badge-size` warning is gone), so a `size` still passed from plain JavaScript now reaches the `<span>` as an ordinary attribute. TypeScript already rejected it. **Migration:** remove `size` from your badges; badges have one size (20px, `text-xs`). Nothing else changes.
