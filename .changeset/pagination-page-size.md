---
"serupa-ds": minor
---

Pagination: `pageSizeOptions` adds an "Items per page" select after the summary. Picking a size calls the new `onPageSizeChange(pageSize, page)` with the page that keeps the first item shown in view. A new `perPage` label names the select ("Item per halaman" in Indonesian). Nothing changes without `pageSizeOptions`.
