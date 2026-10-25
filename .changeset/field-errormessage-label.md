---
"serupa-ds": minor
---

- Added: in a Field with an error, the control also points at the message with `aria-errormessage` (J12). This covers a direct child and any Serupa control at any depth, including both inputs of a DateRangePicker and FileUpload's choose button. The message stays in `aria-describedby` too.
- Fixed: clicking the label of a Field holding a Slider, SegmentedControl or ColorPicker focused nothing, because a label can't focus their `<div>` root. It now focuses the thumb or the checked option (AK1).
