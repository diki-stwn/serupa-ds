---
"serupa-ds": patch
---

- Fixed: ColorPicker reads an opaque color written with its alpha, as design tools and token files export it ("#1D4ED8FF", "#14df"), and rgb() as browser devtools copy it ("rgb(29, 78, 216)"), in `value`, swatches and the hex field; a see-through color is still refused (L8E11).
