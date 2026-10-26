---
"serupa-ds": patch
---

Container: the maximum width is the content's, with the side padding outside it, so `size="prose"` keeps a 672px line at every screen width (each size's box is now up to 64px wider on large screens). The side padding is never less than the screen's safe area, so content stays clear of a notch in landscape (FF1).
