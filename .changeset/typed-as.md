---
"serupa-ds": major
---

- Changed: Link's and BreadcrumbItem's `as` is typed. Their props and `ref` are those of the element `as` names, so `<Link as={RouterLink} to="/settings">` type-checks with RouterLink's own props (a missing or misspelled `to` is an error). Without `as`, they are an `<a>`'s, as before. `LinkProps` and `BreadcrumbItemProps` are now generic types (`LinkProps<typeof RouterLink>`), with the own props in the new `LinkOwnProps` and `BreadcrumbItemOwnProps`.

  **Migration.** Only TypeScript is affected; nothing changes at runtime.
  - Remove the casts or spreads that got router props past the old types. Before: `<Link as={RouterLink} {...{ to: "/x" }}>`. After: `<Link as={RouterLink} to="/x">`.
  - Props that the `as` component doesn't take are now errors. Pass only the props that component accepts. Without `as`, pass only `<a>` props.
  - `interface MyLinkProps extends LinkProps` still works for the `<a>` case. To extend a router link's props, use a type: `type MyLinkProps = LinkProps<typeof RouterLink> & { … }`.
