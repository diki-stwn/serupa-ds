---
"serupa-ds": patch
---

- Fixed: TimelineItem writes its time in a `<time>` only with `dateTime`; without it the shown text ("13 Mar", "2 hours ago") is a `<span>`, since a `<time>` needs a value machines can read, and a `<RelativeTime>` passed as `time` is no longer nested in another `<time>`.
