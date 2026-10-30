---
"serupa-ds": patch
---

- Fixed: Icons, loaders, the Progress ring and Rating's stars no longer stretch to the width of their container before the stylesheet arrives. Each inline svg now carries `width="1em" height="1em"`, so on a slow page, or when bundle.css fails to load, an icon stays the size of the text around it instead of drawing a giant icon and then jumping when the CSS lands. The CSS still sets the size (FEC7).
