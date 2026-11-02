---
"serupa-ds": patch
---

Combobox, VirtualList: a long list that opens with a picked option far down now shows that option and its neighbours, and the arrows step from it. Rows measured while the list was still growing in were counted a little short, which put the drawn rows about 200 away from the option (GR100). A row brought into view at the bottom edge also stays there whole when the rows around it turn out taller or shorter than guessed.
