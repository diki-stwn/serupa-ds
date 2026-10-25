---
"serupa-ds": patch
---

- Fixed: the README gave components.css as about 90 KB; it is about 250 KB (45 KB gzipped).
- Fixed: if making the GitHub release failed after the version's tag was pushed, re-running the Release workflow said the version was already released and never made the release. It now makes the release from the tag.
