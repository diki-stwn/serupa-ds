---
"serupa-ds": minor
---

Text in Arabic, Devanagari, Thai, Japanese, Korean and Chinese gets taller lines and the right font. `--font-sans` now names Noto Sans Arabic, Hebrew, Devanagari and Thai after Inter, used where the device has them. Under `lang="ja"`, `"ko"`, `"zh"` and `"zh-TW"`, the stack puts that language's Noto Sans CJK first, because Han characters are drawn differently in each. Under those languages, and Arabic, Devanagari and Thai, every `--text-*--line-height` is at least 1.5 times the font size (1.6 for Arabic), so marks above and below the letters don't touch the next line. English and Hebrew are unchanged.
