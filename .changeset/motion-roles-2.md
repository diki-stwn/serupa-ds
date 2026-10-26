---
"serupa-ds": minor
---

Added: motion roles for things that change in place and for loops. `motion-change-sm`, `motion-change-md` and `motion-change-lg` (150, 200 and 300ms) time a chevron turning, a panel opening and a fill moving to its value; `motion-loop-blink`, `motion-loop-progress`, `motion-ripple` and `motion-ripple-fade` time the caret, the indeterminate bar and the press ripple; `ease-settle` eases a press or a value arriving. Accordion, Badge, Button, Card, Carousel, Checkbox, Combobox, Drawer, Image, Meter, PinInput, Progress, Radio, SegmentedControl, Sidebar, Slider, SortableList, Stepper, Switch and TreeView now use them, with the same timings as before, so changing a role reaches every component that moves that way. The component tokens that time these (`--accordion-duration`, `--progress-duration` and the rest) default to the roles.
