---
"serupa-ds": patch
---

- Changed: Menu, ContextMenu and MenuSub's submenus fade and shrink back over 100ms when they close, instead of vanishing (where the browser can keep them in the top layer: Chromium today), with their items kept, inert, until the fade ends; a submenu open when its menu closes now closes with it. They enter with a transition rather than keyframes, so closing one mid-way turns back from where it is, and a Menu open on arrival is shown from the first frame. Reduced motion: the fade alone.
