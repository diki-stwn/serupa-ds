---
"serupa-ds": patch
---

Fixed (Toast): a new toast arriving in a full stack no longer stutters. The toasts below now make room on the same curve and time as the arriving toast (`ease-enter`, not the slow-starting `ease-move`), so it no longer sits over the next one before that one has moved. A closing toast, or one pushed into the waiting line, leaves the flow at once, so the rest and the "+N more" line close up in the same glide, rather than in a second one after its fade.
