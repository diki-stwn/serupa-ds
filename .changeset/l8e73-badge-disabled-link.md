---
"serupa-ds": patch
---

- Fixed: Badge: a link badge (href) with disabled could still be followed, focused and clicked, since a link has no disabled state. It now renders without href, with role="link" and aria-disabled, as a disabled link Button does.
