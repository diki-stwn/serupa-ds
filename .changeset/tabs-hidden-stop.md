---
"serupa-ds": patch
---

Tabs: when the selected tab is hidden by CSS or the `hidden` attribute (a responsive class that hides it on a phone, at load or after a resize), the first shown, enabled tab takes the Tab stop, so the tab list stays reachable from the keyboard. Before, Tab went from the control before straight to the panel (GR67, WCAG 2.1.1). The stop goes back to the selected tab once it shows again.
