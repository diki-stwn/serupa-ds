---
"serupa-ds": patch
---

Input and Textarea keep the native `maxlength` in server-rendered HTML, so the limit holds before hydration or without JavaScript. It comes off right after hydration, when the components count characters as people see them.
