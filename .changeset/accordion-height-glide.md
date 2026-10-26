---
"serupa-ds": patch
---

Fixed (Accordion): opening or closing an item no longer makes everything below it jump. The panel's height now grows and shrinks over the same 200ms (150ms closing) as its fade and unfold, so the content below slides. A second press mid-way turns back from where it is. Under reduced motion the height still changes at once, with the fade alone.
