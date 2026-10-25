---
"serupa-ds": minor
---

- Fixed: submitting a form without a required FileUpload focused its hidden input and pointed the browser's bubble at nothing. It now says "Choose a file." in its own alert area, marks the button invalid and focuses it (N2).
- Fixed: FileUpload's refusal messages were English in every language. They're labels now (`fileWrongType`, `fileTooLarge`, `fileTooMany`, `fileOnlyOne`, `fileMissing`), Indonesian in `idLabels`, with the accepted types joined by `Intl.ListFormat` (N3).
- Fixed: dragging text or a link across a FileUpload highlighted it as a drop target. Only drags that carry files do now (N5).
- Added: FileUpload takes `form`, the id of the form its files submit with when it sits outside that form, as a native input does (AJ3).
