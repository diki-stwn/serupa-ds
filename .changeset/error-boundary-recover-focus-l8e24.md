---
"serupa-ds": patch
---

- Fixed: after Try again (or `reset()`, or a `resetKeys` change) in an ErrorBoundary, focus went to the first focusable element of the content that came back even when it was hidden (`display: none`), so focus fell to the top of the page, or out of the Tab order, such as a tab that isn't the selected one. It now goes to the first part that is shown and in the Tab order.
