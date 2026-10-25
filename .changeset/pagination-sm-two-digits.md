---
"serupa-ds": patch
---

Pagination size sm keeps the current page a 24px square with two digits in any font. Its semibold "88" in DejaVu Sans (common on Linux, where Inter isn't installed) is 16.7px, and with 4px sides the page was 24.7px wide. The sides are 2px now (`--pagination-padding-x-sm`, `spacing-0.5`); a one-digit page looks the same, since the square's 24px minimum still sets its width.
