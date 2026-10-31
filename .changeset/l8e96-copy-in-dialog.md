---
"serupa-ds": patch
---

- Fixed: CopyButton in a Dialog or Drawer on a page without the Clipboard API (plain http) copied nothing while it said "Copied": its fallback put the text behind the modal, where it can't be selected. It now puts it inside the dialog.
