---
"serupa-ds": patch
---

SegmentedControl: the indicator slides on translate and scale instead of left and width, so the move runs on the compositor (EG1). Before the script runs, the selected segment shows the indicator's surface itself, so a server-rendered page shows the choice from the first paint (FC1).
