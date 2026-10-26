---
"serupa-ds": patch
---

- Fixed: CopyButton with a `value` that returns a promise hands the copy to the clipboard within the press (a ClipboardItem holding the promise), so Safari no longer refuses it once a fetch outlasts the press. Browsers without ClipboardItem write the text once it's there, as before.
