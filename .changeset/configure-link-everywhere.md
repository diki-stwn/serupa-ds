---
"serupa-ds": minor
---

`configure({ link })` now reaches every component that renders a link. Link, NavbarLink, BreadcrumbItem and ListItem use it as their default `as`, and Pagination's page links (with `getHref`) use it too. Before, only Button, IconButton, Badge, Card and MenuItem did, though the README promised it for all of them. An item's own `as` still wins. Pagination has a new `linkAs` prop for one pagination. Nothing changes until `configure({ link })` is called (BL1).
