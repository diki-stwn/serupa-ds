---
"serupa-ds": minor
---

Added: `initialFocus` on Dialog, a ref to the element that takes focus when the dialog opens, such as Cancel in a confirmation. It wins over `data-autofocus`. A ref to something outside the dialog is ignored, so focus never leaves the modal.
