---
"serupa-ds": patch
---

- Fixed: when several announcements came at once, they were joined with an extra period, so SortableList said "position 1 of 3.. Apollo" and screen readers paused oddly. Messages that end in their own stop are now joined with a space (idea 212).
- Added a test over every built-in label in English and Indonesian: none is empty, has doubled punctuation or spaces, or is left in English in the Indonesian set.
