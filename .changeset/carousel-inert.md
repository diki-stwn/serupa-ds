---
"serupa-ds": patch
---

Carousel: the slides not shown are inert from the first paint, server HTML included, instead of once an effect ran after hydration. React 19 takes `inert` as a prop, so the workaround for React 18 is gone.
