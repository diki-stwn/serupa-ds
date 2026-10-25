---
"serupa-ds": patch
---

Docs: every component guide now says where `id` goes in its Props table: the root element, the native field inside (so a `<label htmlFor>` works), or nowhere (Menu, Popover, ErrorBoundary take none; Tooltip passes it to its trigger). The guides check requires the row from now on.
