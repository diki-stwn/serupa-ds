---
"serupa-ds": patch
---

`base.css`: headings inside `lang="ja"` break between phrases (`word-break: auto-phrase`) instead of between any two characters, so a Japanese word isn't split across lines. Chrome and Edge 119 and later; other browsers break as before.
