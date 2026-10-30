---
"serupa-ds": patch
---

- Fixed: FileUpload cuts a long file name in the middle, as Finder and Drive do. The last few characters and the extension stay visible, so "report-2025.pdf" and "report-2026.pdf" no longer look the same. The full name is the row's title, and screen readers read it once. The name is laid out in its own direction, so a Latin name in a right-to-left page isn't cut at its end (GR17).
