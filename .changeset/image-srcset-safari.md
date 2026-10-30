---
"serupa-ds": patch
---

- Fixed (Image): in Safari, a picture with `srcSet` no longer shows as broken for a moment as it mounts, which also hid the `viewable` button until the picture arrived. Safari says such an image is complete before it has picked a candidate. That no longer counts as a failure, and its load or error event decides.
