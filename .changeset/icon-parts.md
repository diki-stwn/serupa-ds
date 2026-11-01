---
"serupa-ds": minor
---

An icon drawn by name (`<Icon name="rocket_launch" />`) that isn't one of the components' own now downloads only the part of the Material Symbols that holds it, about 86 KB (9 to 20 KB gzipped), instead of the whole 2.7 MB set. The set is cut into 32 parts in name order, and a page downloads only the parts its names are in. Nothing changes in how you write it, and `serupa-ds/icons` still exports every icon. On a plain page, `serupa-icons.iife.js` is still one file.
