---
"serupa-ds": patch
---

- Fixed: InlineEdit no longer pulls focus back after an async `validate`. If you press Enter and then Tab away while the check runs, focus stays where you went when it settles. Focus returns to the button only if it was still in the field, or nowhere.
- Fixed: an InlineEdit with an empty value and no `placeholder` now always shows its pencil, so the button can be found on devices with hover. Before, it was an empty, invisible button until hovered or focused.
