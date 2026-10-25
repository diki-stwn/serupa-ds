---
"serupa-ds": patch
---

Fixed: a project on Node 22 or 24 no longer gets an engines warning (`engines.node` is `>=22`; only working on this repository needs Node 26, in `devEngines`), and CommonJS code can `require("serupa-ds")` and `require("serupa-ds/icons")` on Node 22.12+ through new `"default"` export conditions.
