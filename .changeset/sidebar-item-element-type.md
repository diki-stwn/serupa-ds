---
"serupa-ds": major
---

- **Breaking (TypeScript only).** Changed (SidebarItem): its ref and event handlers are typed for `HTMLElement` instead of `HTMLAnchorElement`, because a group item renders a `<button>`, not a link: the old types promised an anchor that a group's ref and `onClick` never got. Nothing changes at run time. Handlers and refs you typed for `HTMLAnchorElement` still compile; what no longer compiles is reading an anchor-only property, such as `e.currentTarget.href`, from an inferred event, or `React.ComponentRef<typeof SidebarItem>` used as an anchor. **Migration:** on a link item, narrow first (`if (e.currentTarget instanceof HTMLAnchorElement) …`) or read the value from your own props; for a ref, type it `React.Ref<HTMLElement>`.
