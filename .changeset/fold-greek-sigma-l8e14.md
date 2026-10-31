---
"serupa-ds": patch
---

- Fixed: Combobox and Highlight matched Greek words ending in sigma only one way: a search typed in capitals ("ΑΣ") found nothing, because lowercasing writes a final ς there, and Highlight didn't mark "ΟΔΟΣ" for "οδος". ς now matches σ. Highlight also reads a decomposed letter (macOS file names write й as и plus a mark) as the letter it is.
