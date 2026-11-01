---
"serupa-ds": major
---

- **Breaking.** Removed: IconButton's `noTitle` and Table's `captionHidden`, the old names of `hideTitle` and `hideCaption`, deprecated with a development warning and due in this major. Their development warnings (`icon-button-no-title`, `table-caption-hidden`) go with them. **Migration:** rename `noTitle` to `hideTitle` and `captionHidden` to `hideCaption`; both do the same as before. TypeScript flags any you missed.
