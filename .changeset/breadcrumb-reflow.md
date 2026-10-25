---
"serupa-ds": patch
---

- Fixed: a long unbroken Breadcrumb label ran past a 320px screen (WCAG 1.4.10). It now wraps inside the trail.
- Fixed: the "…" button now takes a press over 24×24px, like the links.
- Fixed: a Breadcrumb with no items rendered an empty nav landmark. It now renders nothing.
- Added: an icon-only BreadcrumbItem with no `aria-label` warns once in development.
