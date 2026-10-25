---
"serupa-ds": minor
---

Combobox: `loadOptions(text, { signal })` loads options from a server as people type. It waits for typing to pause (`debounce`, 250ms by default), aborts the request before each new one and drops any answer that isn't for the latest text, so a slow answer for "ca" can't replace the one for "can". The list shows the loading row while it waits and the new `loadFailed` label when the promise rejects. A picked option keeps its label when later answers leave it out. `options` is now optional.
