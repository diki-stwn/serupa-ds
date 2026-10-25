---
"serupa-ds": patch
---

- Fixed: ColorPicker's swatch edge and native color well used `border`, at 1.27:1 on the page, so a white swatch on a white page (or a black one on a dark page) had no visible edge. The `--color-picker-swatch-border` default is now `field-border`, which keeps 3:1 in all six themes (WCAG 1.4.11).
