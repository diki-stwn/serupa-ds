---
"serupa-ds": patch
---

- Fixed: a Popover whose first control was hidden (`display: none`, in a closed `<details>`) or in a disabled `<fieldset>` left focus on its trigger when it opened, so Escape and Tab didn't work inside it. Focus now goes to the first control that can take it, else the panel.
