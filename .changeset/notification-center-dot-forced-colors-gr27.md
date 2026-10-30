---
"serupa-ds": patch
---

- Fixed: NotificationCenter's unread dot no longer disappears in forced colors (Windows high contrast). It had only a background, which forced colors painted as Canvas, the same as the drawer. It's now drawn in CanvasText, as Badge's indicator is (GR27).
