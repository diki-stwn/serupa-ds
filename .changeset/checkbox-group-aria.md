---
"serupa-ds": patch
---

CheckboxGroup: `invalid` now puts `aria-invalid` on each box instead of the `role="group"` wrapper, and the wrapper drops `aria-required`, since a group supports neither. `required` is still each box's native `required` while none is checked, and Field `group` still says "Required" in the legend.
