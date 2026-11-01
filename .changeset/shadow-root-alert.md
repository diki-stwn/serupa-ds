---
"serupa-ds": patch
---

Alert: dismissing it with the focused × inside a shadow root moves focus to the next control in the same shadow root, as it already did on the page (GR60). Before, it read `document.activeElement`, which inside a shadow root is the host, so focus fell to the page once the alert was removed.
