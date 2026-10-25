---
"serupa-ds": minor
---

`useCollator(options?)`: an `Intl.Collator` for the locale the components use (its own `locale` option, else SerupaProvider's, else the browser's), made once per locale and options. Sorting options and table rows with its `compare` puts "Äpfel" beside "Apfel" in German and "Item 2" before "Item 10". PhoneInput's country list now sorts with the same Collator.
