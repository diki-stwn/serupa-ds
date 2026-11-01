---
"serupa-ds": patch
---

- Fixed: a page with two copies of serupa-ds (two versions installed by different packages, or two apps built apart) keeps one list of open modals and one pair of live regions. A Dialog from one copy now takes the other copy's live regions inside it, so what that copy announces is heard while the dialog is open.
