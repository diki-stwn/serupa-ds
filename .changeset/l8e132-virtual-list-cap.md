---
"serupa-ds": patch
---

VirtualList: End on a very long list (500,000 rows and more) no longer sometimes ends in an update loop that emptied the list (GR91), and past the browser's maximum element height the scroll range is scaled, so the last of 1,000,000 rows can be reached (GR92).
