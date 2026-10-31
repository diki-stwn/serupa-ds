---
"serupa-ds": patch
---

Toolbar: when the window narrows after load and a breakpoint hides the control holding the toolbar's Tab stop (`display: none`), the stop now moves to a control that's still shown. Before, nothing re-rendered, and Tab skipped the whole toolbar (WCAG 2.1.1).
