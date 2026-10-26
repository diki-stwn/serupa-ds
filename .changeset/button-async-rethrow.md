---
"serupa-ds": patch
---

- Fixed: a rejected promise from Button's `onClick` was marked handled by Button, so it never reached `window`'s `unhandledrejection`, Sentry or other error reporting. Button now rethrows it after ending the loading, so it's reported once, as it would be without Button.
