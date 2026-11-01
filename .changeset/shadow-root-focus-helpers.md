---
"serupa-ds": patch
---

Inside a shadow root, the shared focus helpers now read focus and ids from the element's own root rather than the page's. A control that disables itself hands focus on, as Pagination's and Carousel's arrows do at the ends. Pressing a Textarea's padding focuses the field. A form named by a `form` attribute resets the controls in it. A clear button reads its field's `aria-labelledby` name.
