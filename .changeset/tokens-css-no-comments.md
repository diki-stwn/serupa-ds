---
"serupa-ds": patch
---

tokens.css is less than half its size (95 KB to 41 KB, 18.7 to 7.4 KiB gzipped): it no longer carries a comment with each token's description. It is the first stylesheet every page waits for, and the comments were 58% of it. The descriptions are still in tokens.json, design-tokens/, the Foundations pages and the editor hover text (serupa-ds/vscode/*), which now reads them from tokens.json. The variables and their values are unchanged.
