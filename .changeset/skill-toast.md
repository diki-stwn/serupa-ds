---
"serupa-ds": patch
---

The Serupa skill for coding agents now says which feedback to use: `toast()` (with one `<Toaster />`) to confirm that something worked, `Alert` for a message that stays until it's dealt with, and `SaveStatus` for autosave. In the skill eval, an agent with the skill used an inline Alert for "saved"; with this rule it calls `toast()`.
