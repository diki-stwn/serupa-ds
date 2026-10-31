---
"serupa-ds": patch
---

Combobox: "No results" and "Couldn't load" are said through the shared announcer once typing stops, as the result counts are. Before, they relied on a status row inserted with its text already in it, which VoiceOver and JAWS don't read. Those rows are now plain text, so nothing is said twice.
