// src/internal/cn.ts
import * as React from "react";
function cn(...names) {
  return names.filter(Boolean).join(" ");
}
function domId(prefix, reactId) {
  return prefix + reactId.replace(/[^A-Za-z0-9_-]/g, "");
}
function oneOf(list, value, fallback) {
  return list.indexOf(value) < 0 ? fallback : value;
}
function omit(props, own) {
  const rest = {};
  for (const k in props) if (!own[k]) rest[k] = props[k];
  return rest;
}
function isInvalid(invalid, ariaInvalid) {
  return !!invalid || ariaInvalid === true || ariaInvalid === "true";
}
function setRef(ref, node) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}
function elementRef(el) {
  const r = parseInt(React.version, 10) >= 19 ? el.props.ref : el.ref;
  return r ?? void 0;
}
var SIZES = ["sm", "md", "lg"];
var useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
export {
  SIZES,
  cn,
  domId,
  elementRef,
  isInvalid,
  omit,
  oneOf,
  setRef,
  useIsoLayoutEffect
};
//# sourceMappingURL=cn.js.map
