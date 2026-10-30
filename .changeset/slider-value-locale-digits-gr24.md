---
"serupa-ds": patch
---

- Fixed: Slider's `showValue` chip writes the number in the locale's digits and marks when there's no `formatValue`, as Badge and Pagination do: "٤٠" in Arabic and "1.500" in Indonesian, instead of "40" and "1500" (GR24).
