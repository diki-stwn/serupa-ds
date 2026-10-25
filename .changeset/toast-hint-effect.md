---
"serupa-ds": patch
---

- Fixed: the Toaster set the F8 hint while rendering and never cleared it, so after the Toaster unmounted a toast with an action still told screen readers to press F8, which did nothing. The hint is set once the Toaster mounts and cleared when it goes (W3).
- Fixed: a toast that closed with focus in it (its ×, its action, `toast.dismiss()`) dropped focus on the page body. Focus now goes back where F8 came from, or else to the toast next to it (AO1).
