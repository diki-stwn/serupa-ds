---
"serupa-ds": patch
---

- Fixed: Breadcrumb with `collapse="menu"` now passes each hidden page's own props to its menu item (a router link's `to`, `target`, `data-*`, `onClick`), so a page given as `as={RouterLink} to="/org"` still goes there from the menu.
