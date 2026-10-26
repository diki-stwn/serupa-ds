---
"serupa-ds": minor
---

Added (Toast): swipe to dismiss on touch screens. A toast dragged sideways follows the finger and fades as it goes. Let go past a third of its width, or flicked, it carries on at the finger's speed on `ease-fling` and closes. Otherwise it slides back. Its time stops while it's under the finger. Vertical drags still scroll the page, mouse drags do nothing, and the close button stays for everyone else. Under reduced motion a swiped-away toast fades instead of flying off.
