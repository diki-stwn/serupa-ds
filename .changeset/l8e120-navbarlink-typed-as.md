---
"serupa-ds": major
---

- Changed: NavbarLink's `as` is typed, as Link's and BreadcrumbItem's are. Its props and `ref` are those of the element `as` names, so `<NavbarLink as={RouterLink} to="/team">` type-checks with RouterLink's own props, and a missing or misspelled `to` is an error. Without `as`, they are an `<a>`'s, as before. `NavbarLinkProps` is now a generic type (`NavbarLinkProps<typeof RouterLink>`), and its own props are in the new `NavbarLinkOwnProps`.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<NavbarLink as={RouterLink} {...{ to: "/x" }}>`. After: `<NavbarLink as={RouterLink} to="/x">`.
  - Props that the `as` component doesn't take are now errors. Pass only the props that component accepts. Without `as`, pass only `<a>` props.
  - `interface MyNavLinkProps extends NavbarLinkProps` still works for the `<a>` case. To extend a router link's props, use a type: `type MyNavLinkProps = NavbarLinkProps<typeof RouterLink> & { … }`.
