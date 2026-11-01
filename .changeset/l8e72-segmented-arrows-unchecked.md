---
"serupa-ds": patch
---

- Fixed: SegmentedControl: with nothing checked that can be chosen (no value, or a disabled one), the arrow keys go from the focused segment, as in a native radio group. Before, the first arrow picked the focused segment itself and ArrowLeft skipped the last one.
