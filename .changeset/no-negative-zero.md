---
"serupa-ds": patch
---

FormattedNumber, formatNumber and TableCell no longer show a negative zero: a small negative value that rounds to zero is written as zero ("$0.00", not "-$0.00"; "0%", not "-0%"), and -0 is "0". A real negative keeps its minus, and a signDisplay of your own is kept.
