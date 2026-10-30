---
"serupa-ds": minor
---

- Fixed: FileUpload writes file sizes in the reader's locale, the same way FormattedNumber `format="bytes"` does: "4,8 MB" in Indonesian and German, "2 kB" in English, Arabic digits in Arabic. This covers each listed size and the size in a "larger than" refusal. Each size is isolated with `dir="auto"`, so an English size in an RTL page no longer shows as "KB 2". `formatFileSize(bytes, locale?)` takes an optional locale and is unchanged without one (GR20).
