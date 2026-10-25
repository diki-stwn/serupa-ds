---
"serupa-ds": minor
---

Added: ContextMenu, a Menu opened from an area instead of a button.

- A right-click (or a long press on touch) opens it at the pointer. Shift+F10 or the Menu key opens it at the focused element.
- It has Menu's items, keys, top layer and closing. Escape or a choice puts focus back where it was.
- `aria-label` names it, and `disabled` leaves the browser's own menu in place.

`<ContextMenu aria-label="File actions" target={<Card tabIndex={0}>…</Card>}>…</ContextMenu>`
