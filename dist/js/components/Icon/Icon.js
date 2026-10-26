"use client";

// src/components/Icon/Icon.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { warnOnce } from "../../internal/warn.js";
import { ICONS, hasIcon, getIcon, getRegisteredIcon, loadIcon } from "../../icons.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
var never = () => () => {
};
var yes = () => true;
var no = () => false;
function shapes(markup) {
  const kids = [[]], open = [];
  for (const [, close, tag, attrs, alone] of markup.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)) {
    const here = kids[kids.length - 1];
    if (close) {
      const [t, p2] = open.pop(), inner = kids.pop();
      kids[kids.length - 1].push(React.createElement(t, p2, ...inner));
      continue;
    }
    const p = { key: String(here.length) };
    for (const [, k, v] of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) p[k.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = v;
    if (alone) here.push(React.createElement(tag, p));
    else {
      open.push([tag, p]);
      kids.push([]);
    }
  }
  return kids[0];
}
var Icon = /* @__PURE__ */ component("Icon", function Icon2(props, ref) {
  const restyle = useServerStyles(ref);
  const [tries, again] = React.useReducer((n) => n + 1, 0);
  const own = useSerupa().icons;
  const hydrated = React.useSyncExternalStore(never, yes, no);
  const custom = !props.icon && hasIcon(props.name);
  const data = props.icon || (custom || props.name == null ? void 0 : own.get(props.name) || (hydrated ? getIcon : getRegisteredIcon)(props.name));
  const missing = !custom && !data && props.name != null;
  React.useEffect(() => {
    if (!missing) return;
    let live = true, offline = () => {
    };
    loadIcon(props.name).then((found) => {
      if (!live) return;
      if (found) again();
      else if (process.env.NODE_ENV !== "production") warnOnce("icon-unknown", `Icon: "${props.name}" isn't a Material Symbol or one of your icons. Check the name on the Icons page (Foundations/Icons).`, "icon:" + props.name);
    }, (err) => {
      if (!live) return;
      if (process.env.NODE_ENV !== "production") warnOnce("icon-load", `Icon: the icons drawn by name didn't load (${err instanceof Error ? err.message : String(err)}), so "${props.name}" is empty for now. It tries again when the browser is back online; pass icon={\u2026} to draw an icon without loading it.`);
      window.addEventListener("online", again, { once: true });
      offline = () => window.removeEventListener("online", again);
    });
    return () => {
      live = false;
      offline();
    };
  }, [missing, props.name, tries]);
  const rest = omit(props, { name: 1, icon: 1, size: 1, className: 1, style: 1 });
  const labelled = rest["aria-label"] || rest["aria-labelledby"];
  if (!labelled) rest["aria-hidden"] = true;
  else rest.role = "img";
  const style = Object.assign({}, props.style);
  if (props.size != null) style.fontSize = typeof props.size === "number" ? props.size + "px" : props.size;
  const name = props.icon ? props.icon.name : props.name;
  if (name != null) rest["data-icon"] = name;
  if (custom) {
    return /* @__PURE__ */ React.createElement("span", { ...rest, ref: restyle, className: cn("dk-icon dk-icon--custom", props.className), style }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, focusable: "false" }, shapes(ICONS[props.name])));
  }
  return /* @__PURE__ */ React.createElement("span", { ...rest, ref: restyle, className: cn("dk-icon", props.className), style }, data && /* @__PURE__ */ React.createElement("svg", { viewBox: "0 -960 960 960", fill: "currentColor", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: data.d })));
});
export {
  Icon
};
//# sourceMappingURL=Icon.js.map
