---
"serupa-ds": minor
---

Added: Rating, stars to pick a score or to show one. Interactive, it's a `role="radiogroup"` of native radios (one per star, or two with `allowHalf`) named "3 stars", so arrow keys, forms and screen readers work as in any radio group. `clearable` clears on a second pick, Backspace or Delete. `readOnly` draws any fraction as one image named "4.3 out of 5". It takes `value`/`defaultValue`/`onValueChange`, `max`, `size`, `name`, `required`, `disabled`, `invalid`, works in a Field, and supports right to left. New labels: `ratingStars` and `ratingValue`.
