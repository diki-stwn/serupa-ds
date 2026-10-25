---
"serupa-ds": minor
---

Drawer: swipe to close. On a touch screen, dragging it toward its edge past a third of its size (or flicking it) asks to close with `reason: 'swipe'`; a shorter drag springs back. Top and bottom drawers are dragged by the header or footer so the body still scrolls. `swipeToClose={false}` turns it off. `OpenChangeReason` gains `'swipe'`.
