---
"serupa-ds": patch
---

PhoneInput: hydrating no longer fails when the server words a country name differently from the browser, for example Node's "Falkland Islands (Islas Malvinas)". The server's options stay in place during hydration and are drawn again in the browser's words right after.
