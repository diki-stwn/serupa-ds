---
"serupa-ds": patch
---

- Fixed: a disabled ListItem given as a router link (`as` with `linkProps.to`) no longer renders the router's href, so a middle or Ctrl click can't open it. It is a plain `<a>` without an address, keeping the aria-*, data-*, id, title and styling from `linkProps`.
