// src/internal/pageShared.ts
function pageShared(name, make) {
  if (typeof document === "undefined") return make();
  const key = /* @__PURE__ */ Symbol.for("serupa-ds/" + name), page = globalThis;
  return page[key] || (page[key] = make());
}
export {
  pageShared
};
//# sourceMappingURL=pageShared.js.map
