// src/icons.ts
var ICONS = {};
var customIcons = /* @__PURE__ */ Object.freeze([]);
function hasIcon(name) {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(ICONS, name);
}
var NAMED = /* @__PURE__ */ new Map();
var loading;
var loadingNamed;
function loadIcon(name) {
  const found = () => NAMED.get(name);
  if (!loadingNamed) loadingNamed = import("./material/named.js").then((m) => {
    for (const v of m.NAMED_ICONS) if (!NAMED.has(v.name)) NAMED.set(v.name, v);
  });
  return loadingNamed.then(() => found() || loadAllIcons().then(found));
}
function loadAllIcons() {
  return loading || (loading = import("./material/icons.js").then((all) => {
    for (const v of Object.values(all)) if (isIconData(v) && !NAMED.has(v.name)) NAMED.set(v.name, v);
  }));
}
function registerIcons(...icons) {
  for (const x of icons) {
    if (isIconData(x)) NAMED.set(x.name, x);
    else for (const v of Object.values(x)) if (isIconData(v)) NAMED.set(v.name, v);
  }
}
function getIcon(name) {
  return NAMED.get(name);
}
function isIconData(x) {
  return !!x && typeof x === "object" && typeof x.name === "string" && typeof x.d === "string";
}
export {
  ICONS,
  customIcons,
  getIcon,
  hasIcon,
  isIconData,
  loadAllIcons,
  loadIcon,
  registerIcons
};
//# sourceMappingURL=icons.js.map
