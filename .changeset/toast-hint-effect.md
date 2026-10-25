---
"serupa-ds": patch
---

- Fixed: the Toaster set the F8 hint while rendering and never cleared it, so after the Toaster unmounted a toast with an action still told screen readers to press F8, which did nothing. The hint is set once the Toaster mounts and cleared when it goes (W3).
