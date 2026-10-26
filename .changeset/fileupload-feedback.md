---
"serupa-ds": minor
---

- Fixed: A file dropped just outside a FileUpload no longer opens in the tab, replacing the page and losing the form. While a FileUpload can take files, a file drop that nothing else handled is stopped on the document.
- Fixed: Removing a file moves focus to the next file's remove button, or the one before it, rather than back to the choose button. A keyboard user clearing several files stays in the list.
- Added: Adding and removing files are announced politely ("report.pdf added.", "3 files added.", "report.pdf removed."), with new labels `filesAdded` and `fileRemoved`, in English and Indonesian.
- Added: A dropped folder is refused with the new reason `'folder'` and a message (`fileFolder`), instead of being added as an empty file.
- Added: A file that's already in the list is skipped with a message ("report.pdf is already added.", `fileAlreadyAdded`) and the new reason `'duplicate'`, instead of silently.
