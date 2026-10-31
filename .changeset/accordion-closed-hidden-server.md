---
"serupa-ds": patch
---

Accordion: closed content is hidden in the server's HTML too, so a page whose stylesheet is slow or blocked no longer shows every closed answer. Once the script runs it's `hidden="until-found"` as before, so find-in-page still opens it.
