---
"serupa-ds": minor
---

Added: Splitter, two panes with a handle between them that resizes the first, following the WAI-ARIA window splitter pattern (a focusable `role="separator"` with `aria-valuenow`, arrow keys, Home and End, and Enter to collapse with `collapsible`). Sizes are percent, with `min`, `max`, `step`, `size`/`defaultSize`/`onSizeChange`, `direction="vertical"`, right-to-left support and an optional `storageKey` that keeps the layout for the next visit. New label: `resizePanes`.
