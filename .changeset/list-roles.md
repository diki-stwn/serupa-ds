---
"serupa-ds": patch
---

- Fixed: Lists without bullets keep their list role in Safari. WebKit drops list semantics from a `<ul>` or `<ol>` styled `list-style: none` outside a `<nav>`, so VoiceOver stopped saying "list, 6 items". List, SortableList, Timeline, Grid and Stack as `ul`/`ol`, the Toaster, FileUpload's chosen files and AvatarGroup's "more" popover now set `role="list"`; your own `role` still wins on Grid, Stack and List.
