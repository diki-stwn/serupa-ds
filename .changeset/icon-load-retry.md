---
"serupa-ds": patch
---

Icons drawn by name now recover from a failed load. Before, if the icon chunk failed once (a network blip, or a deploy that removed the old chunk), every Icon given a `name` stayed empty for the rest of the visit, with no message. Now the failure is forgotten, so the next Icon loads again. An Icon left empty tries again when the browser is back online. In development, it warns once with the reason (`icon-load`).
