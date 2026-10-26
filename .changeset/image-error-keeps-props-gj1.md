---
"serupa-ds": patch
---

Image: a picture that fails to load stays in the frame, hidden under the fallback, so its className, style, id, data-* and ref keep working and a fixed-ratio frame keeps its size instead of collapsing to 0x0 (GJ1). A failed frame with no size of its own is at least --image-min-size wide.
