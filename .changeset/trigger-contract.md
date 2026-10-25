---
"serupa-ds": patch
---

- Changed: Popover, Menu, ContextMenu and Tooltip given a text, several elements or a Fragment as the trigger throw an error that names the component, instead of React's "expected to receive a single React element child". A trigger that doesn't forward its ref warns once.
