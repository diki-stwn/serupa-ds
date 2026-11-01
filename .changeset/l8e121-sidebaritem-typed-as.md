---
"serupa-ds": major
---

- Changed: SidebarItem's `as` is typed, as Link's and BreadcrumbItem's are. Its props are those of the element `as` names, so `<SidebarItem as={RouterLink} to="/inbox" label="Inbox">` type-checks with RouterLink's own props, and a missing or misspelled `to` is an error. Without `as`, they are an `<a>`'s, as before. The `ref` stays an `HTMLElement`, because a group item renders a button. `SidebarItemProps` is now a generic type (`SidebarItemProps<typeof RouterLink>`), and its own props are in the new `SidebarItemOwnProps`.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<SidebarItem as={RouterLink} {...{ to: "/x" }} label="X">`. After: `<SidebarItem as={RouterLink} to="/x" label="X">`.
  - Props that the `as` component doesn't take are now errors. Pass only the props that component accepts. Without `as`, pass only `<a>` props.
  - Handlers without `as` are typed for an `<a>` (`MouseEvent<HTMLAnchorElement>`), not `HTMLElement`. A handler that takes `MouseEvent<HTMLElement>` still fits.
  - `interface MyItemProps extends SidebarItemProps` still works for the `<a>` case. To extend a router link's props, use a type: `type MyItemProps = SidebarItemProps<typeof RouterLink> & { … }`.
