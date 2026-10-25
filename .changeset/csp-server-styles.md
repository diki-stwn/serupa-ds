---
"serupa-ds": patch
---

Server-rendered pages under a strict Content Security Policy (no `'unsafe-inline'` for style attributes): Progress, Meter, Slider, ColorPicker, AvatarGroup, Icon, Carousel and Image apply their `style` attributes again right after hydration, through the DOM, so a Progress bar, a Slider thumb, and swatch colours show as they should. A render in the browser is unchanged.
