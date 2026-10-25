---
"serupa-ds": patch
---

- Fixed: at size `sm`, the buttons inside a field (SearchInput's clear, PasswordInput's show/hide, NumberInput's steppers) were 22px with nothing around them to press, short of WCAG 2.5.8's 24px. Each now takes presses over 24px, through a box behind it, without changing the layout.
