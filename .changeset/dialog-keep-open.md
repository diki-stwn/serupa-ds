---
"serupa-ds": patch
---

- Fixed: a Dialog or Drawer whose parent kept `open` true after Escape was closed by Chromium on the second Escape (a page can refuse it only once per click), and then stayed closed while `open` was still true, with the page behind no longer inert. It now opens again, so `open` stays the truth (AI1).
