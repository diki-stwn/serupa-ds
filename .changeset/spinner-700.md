---
"serupa-ds": minor
---

Spinners turn faster: `--motion-loop-spinner` goes from 1000ms to 700ms a turn, so a wait feels shorter. This covers Loader's ring and everything built on it (Button, Badge, SearchInput), Switch's pending ring and the circular Progress. Under reduced motion they still stand still and breathe, now over 1.4s (twice the turn) instead of 2s. To keep the old speed, set `--motion-loop-spinner: var(--duration-1000)`.
