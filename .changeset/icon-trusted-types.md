---
"serupa-ds": patch
---

Icon draws your custom icons as elements instead of writing their markup as HTML, so a page with Trusted Types on (`require-trusted-types-for 'script'`) needs no policy for Serupa. Nothing else in the package writes HTML either, and a new story-wide test keeps it that way.
