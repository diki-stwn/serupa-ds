---
"serupa-ds": patch
---

- Divider: a text `label` now names the separator through `aria-label`. A separator's content is presentational, so screen readers skipped the "or". A label that isn't text stays as normal content, and the divider then has no separator role (BQ1).
- Card: in a linked card, body text and the header's description can be selected and copied with the mouse. Before, the link's area covered them. A plain click on that text still follows the link (BO1).
