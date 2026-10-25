---
"serupa-ds": minor
---

- Added: `--pagination-padding-x-sm` token (4px), the side padding of a page at size sm.
- Fixed: Pagination size sm stays a 24px square in any font. With 8px sides there was 8px left for the number, so a "1" in DejaVu Sans (common on Linux, where Inter isn't installed) made the page 24.36px wide.
