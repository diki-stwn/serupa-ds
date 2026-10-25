---
"serupa-ds": minor
---

Combobox: the list now enters like Menu and Popover. It fades in and grows from the edge facing the field over `motion-enter-sm`, as a transition from `@starting-style` (not keyframes), so closing it mid-way never restarts the motion. Under reduced motion it only fades. The motion gate now opens a Combobox too.
