---
"serupa-ds": patch
---

- Fixed: in a collapsed Sidebar, a group's button now shows its label as a tooltip on hover and focus, as the links do. Before, an icon-only group gave sighted users no name (BA2).
- Fixed: `ref` on a group SidebarItem was dropped. It now reaches the group's button, both expanded and in the rail, as the guide says (BA1).
- SidebarItem links now use the link component set with `configure({ link })`, as Button and MenuItem already do. `as` still wins for one item (BL1, Sidebar part).
