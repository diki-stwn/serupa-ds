---
"serupa-ds": major
---

RelativeTime shows the date, not words, for a moment more than 7 days away, ago or ahead: "Oct 24, 2026" rather than "340 days ago" (KW8). The exact date and time stay in the tooltip. The new `absoluteAfter` prop sets the number of days, and `absoluteFormat` how the date is written (default `{ dateStyle: "medium" }`). `relativeTime()` is unchanged and always gives words.

**Migration:** to keep words however far away, as before, pass `absoluteAfter={false}`. A NotificationCenter or SaveStatus time older than a week now shows its date too.
