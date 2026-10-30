---
"serupa-ds": patch
---

- Fixed: TypeToConfirm accepts a phrase whose accents were typed or pasted as separate marks. "Café" pasted from a macOS file name, or typed by some Vietnamese input methods, is "e" plus an accent, and it never matched the "é" in the phrase, so the button stayed disabled. Both are now compared in the same Unicode form (NFC). A missing accent still doesn't match (GR40).
