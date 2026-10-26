---
"serupa-ds": minor
---

- Added: `useShortcut(keys, handler, { description, group })` sets up a keyboard shortcut anywhere on the page while a component is mounted. It skips text fields (unless the shortcut has mod), open modals and IME composition, and the newest shortcut wins.
- Added: `<KeyboardShortcuts />` is a help dialog, opened with "?", that lists every described shortcut by group with its keys in Kbd. It also takes `shortcuts` that aren't set up with `useShortcut`.
