---
"serupa-ds": patch
---

FileUpload: the choose button no longer carries `aria-invalid` or `aria-errormessage`, which a button doesn't support. The error is still in the button's description: Field's `error` already was, and your own `aria-errormessage` now joins it. `aria-invalid` moves to the native file input. The drop area is now `role="presentation"`, since the button is how the keyboard and screen readers reach the picker, and a disabled FileUpload puts `aria-disabled` on its root instead of the drop area.
