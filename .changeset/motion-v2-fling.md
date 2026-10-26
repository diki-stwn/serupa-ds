---
"serupa-ds": minor
---

Added: `ease-fling` (`ease-out-cubic`), the curve for something the hand let go of mid-motion carrying on to rest.

Changed: a flicked Drawer or Carousel now carries on at the finger's speed. Before, it switched to a speed of its own the moment you let go. The settle runs on `ease-fling` for three times the distance left divided by the finger's speed (between 150 and 400ms), so it starts exactly as fast as the finger was moving and slows to rest. A release from a standstill, or a flick back, returns briskly. Drawer and Carousel now share one gesture-speed helper, so a flick reads the same in both.
