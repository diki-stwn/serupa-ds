---
"serupa-ds": patch
---

Drawer: a swipe let go short of a third, but still moving toward the edge, now closes the drawer if its momentum would carry it past a third, as a scroll would (keeping 0.99 of its speed each ms, so 0.15 px/ms carries on about 15px). Before, it sprang back from its last position unless it was a flick. A drag that has stopped still springs back.
