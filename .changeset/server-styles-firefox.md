---
"serupa-ds": patch
---

- Fixed: in Firefox, on a page whose Content Security Policy blocks style attributes, server-rendered Progress and Meter fills, Slider thumbs and the other styles set on the server now apply once the page hydrates. Before, they stayed ignored until the value changed.
