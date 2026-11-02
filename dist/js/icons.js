// src/icons.ts
var ICONS = {};
var customIcons = /* @__PURE__ */ Object.freeze([]);
function hasIcon(name) {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(ICONS, name);
}
var NAMED = /* @__PURE__ */ new Map();
var loading;
var loadingNamed;
var LOADED = /* @__PURE__ */ new Set();
var loaded = (v) => {
  if (!NAMED.has(v.name)) {
    NAMED.set(v.name, v);
    LOADED.add(v.name);
  }
};
var iconChunks = {
  named: () => import("./material/named.js"),
  part: (name) => import("./material/parts.js").then((m) => m.loadPart(name)),
  all: () => import("./material/icons.js")
};
function loadIcon(name) {
  const found = () => NAMED.get(name);
  if (!loadingNamed) loadingNamed = iconChunks.named().then((m) => {
    for (const v of m.NAMED_ICONS) loaded(v);
  }).catch((err) => {
    loadingNamed = void 0;
    throw err;
  });
  return loadingNamed.then(() => found() || (loading ? loading.then(found) : loadPartFor(name).then(found)));
}
function loadPartFor(name) {
  return iconChunks.part(name).then((all) => {
    for (const v of Object.values(all)) if (isIconData(v)) loaded(v);
  });
}
function loadAllIcons() {
  return loading || (loading = iconChunks.all().then((all) => {
    for (const v of Object.values(all)) if (isIconData(v)) loaded(v);
  }).catch((err) => {
    loading = void 0;
    throw err;
  }));
}
function registerIcons(...icons) {
  for (const x of icons) {
    for (const v of isIconData(x) ? [x] : Object.values(x)) if (isIconData(v)) {
      NAMED.set(v.name, v);
      LOADED.delete(v.name);
    }
  }
}
function getIcon(name) {
  return NAMED.get(name);
}
function getRegisteredIcon(name) {
  return LOADED.has(name) ? void 0 : NAMED.get(name);
}
function isIconData(x) {
  return !!x && typeof x === "object" && typeof x.name === "string" && typeof x.d === "string";
}
export {
  ICONS,
  customIcons,
  getIcon,
  getRegisteredIcon,
  hasIcon,
  iconChunks,
  isIconData,
  loadAllIcons,
  loadIcon,
  registerIcons
};
//# sourceMappingURL=icons.js.map
