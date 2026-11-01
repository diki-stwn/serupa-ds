---
"serupa-ds": minor
---

Inter is now split by script. `tokens.css` points at `fonts/InterVariable-latin.woff2`, `-latin-ext`, `-cyrillic`, `-cyrillic-ext`, `-greek`, `-greek-ext`, `-vietnamese` and `-symbols` (and the same for italic), each with its `unicode-range`. A page downloads only the scripts its text uses, so an English page fetches 103 KiB of upright Inter instead of 344. Every weight, feature and glyph is still there. One thing changes: a word that mixes letters from two files, such as Polish "Łódź" (Ł and ź are in latin-ext, ó and d in latin), loses the kerning between those letters, because a font only kerns its own glyphs. Google Fonts' Inter works the same way. On Linux with font hinting on, such a mixed line can also come out a pixel wider or narrower, because the hinter measures each file on its own.

If you preload the font, point the preload at the subset your page uses:

```html
<link rel="preload" href="fonts/InterVariable-latin.woff2" as="font" type="font/woff2" crossorigin>
```

A preload of `fonts/InterVariable.woff2` still works, but `tokens.css` no longer uses that file, so the browser downloads it for nothing. The whole-font files still ship, for a page that writes its own `@font-face`.
