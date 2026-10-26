---
"serupa-ds": patch
---

A component's bundle now carries only its own built-in words and the shared ones, not every component's: importing only Button ships about 1.9 KiB gzipped less. `useSerupa().labels` and `enLabels` still hold every word.
