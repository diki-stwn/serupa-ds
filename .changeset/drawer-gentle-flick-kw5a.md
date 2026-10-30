---
"serupa-ds": patch
---

Drawer: a gentle flick toward the edge now closes it. The swipe speed needed is 0.2px per ms over the last 100ms, down from 0.5, so a light flick no longer springs back (KW5a). A drag away from the edge now gives a little against growing resistance, up to 24px, instead of stopping dead. The panel's background extends past its edge so no gap opens. The panel is now `position: relative`, so absolutely positioned content inside it is placed against the panel. Carousel's rubber band moves to a shared helper, with no change to how it behaves.
