---
"serupa-ds": patch
---

- Fixed: Drawer slides in and out smoothly from every side. A right or bottom drawer was placed against its edge only while open, so as it began to close the panel jumped to the opposite edge and slid from there. Opening, focusing the first control while the panel was still off-screen scrolled the drawer, so the panel appeared most of the way in on the first frame and the slide played out of view; the drawer now clips rather than scrolls its overflow.
