---
"serupa-ds": minor
---

Menu: new `MenuSub`, an item that opens a submenu at its end edge (the left in rtl, flipping when there's no room). → (← in rtl), Enter or Space opens it on its first item; ← (→ in rtl) or Escape closes it back on the item; ↑ ↓ Home End and letters stay inside it. Hovering opens it after 150ms, and it closes 150ms after the pointer settles on another item. Choosing an item in it closes every level. New token `--menu-sub-offset`.
