---
"serupa-ds": major
---

- Changed: MenuItem's `as` is typed, as Link's, NavbarLink's and SidebarItem's are. Its props are those of the element `as` names, so `<MenuItem as={RouterLink} to="/settings">` type-checks with RouterLink's own props (its README promised that, but `to` was a type error), and a missing or misspelled `to` is an error. Without `as`, they are an `<a>`'s (`href`, `target`, `rel` and the rest), whether the item is a link or an action. The `ref` stays an `HTMLElement`. `MenuItemProps` is now a generic type (`MenuItemProps<typeof RouterLink>`), and its own props are in the new `MenuItemOwnProps`. MenuCheckboxItem and MenuRadioItem are unchanged.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<MenuItem as={RouterLink} {...{ to: "/x" }}>`. After: `<MenuItem as={RouterLink} to="/x">`.
  - Props that the `as` component doesn't take are now errors.
  - Handlers on an item are typed for an `<a>` (`MouseEvent<HTMLAnchorElement>`). A handler that takes `MouseEvent<HTMLElement>` still fits; one written for `HTMLDivElement` needs `HTMLElement`.
  - `interface MyItemProps extends MenuItemProps` still works. To extend a router link's props, use a type: `type MyItemProps = MenuItemProps<typeof RouterLink> & { … }`.
