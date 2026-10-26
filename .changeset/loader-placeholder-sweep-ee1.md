---
"serupa-ds": patch
---

- Changed: Loader's text shine and skeleton shimmer now move on `translate`, which the compositor runs, instead of `background-position`, which repainted every frame. They look the same: the same 2s `ease-in-out` sweep, the same stops and colors, and plain text or a still fill under reduced motion and forced colors. The skeleton's bone gets `overflow: hidden` and a `::after` layer three bones wide that slides through it. The text variant's label gets a `.dk-loader__glint` child: a window holding a full-color copy of the words (generated content, so it isn't read and `textContent` is unchanged). In browsers without `color-mix()` the words are plain text, as before. Right to left, both sweep from right to left.
