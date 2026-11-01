/* What the whole page shares, kept once per page even when it has two copies of serupa-ds: two versions installed
   by different packages, or two apps built apart (micro frontends). Each copy has its own modules, so a list kept in
   one module was two lists: a Dialog from one copy didn't move the other copy's live regions into it, and what that
   copy announced went unheard behind the modal (the page behind one is inert). Kept on globalThis under a
   Symbol.for key, which every copy reaches. The name carries the shape's version ("layers@1"): a release that
   changes what's kept changes the name, so an older copy never reads a shape it doesn't know.
   A server keeps one copy per module, as before: globalThis there outlives every request, and none of this is
   used in a server render. */
export function pageShared<T extends object>(name: string, make: () => T): T {
  if (typeof document === "undefined") return make();
  const key = Symbol.for("serupa-ds/" + name), page: Record<symbol, T | undefined> = globalThis;
  return page[key] || (page[key] = make());
}
