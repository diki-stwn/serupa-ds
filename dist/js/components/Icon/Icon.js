"use client";

// src/components/Icon/Icon.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { warnOnce } from "../../internal/warn.js";
import { ICONS, hasIcon, getIcon, loadIcon } from "../../icons.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
var Icon = /* @__PURE__ */ component("Icon", function Icon2(props, ref) {
  const restyle = useServerStyles(ref);
  const [, loadedAll] = React.useReducer((n) => n + 1, 0);
  const own = useSerupa().icons;
  const custom = !props.icon && hasIcon(props.name);
  const data = props.icon || (custom || props.name == null ? void 0 : own.get(props.name) || getIcon(props.name));
  const missing = !custom && !data && props.name != null;
  React.useEffect(() => {
    if (!missing) return;
    let live = true;
    loadIcon(props.name).then((found) => {
      if (!live) return;
      if (found) loadedAll();
      else warnOnce("icon:" + props.name, `Icon: "${props.name}" isn't a Material Symbol or one of your icons. Check the name on the Icons page (Foundations/Icons).`);
    }, () => {
    });
    return () => {
      live = false;
    };
  }, [missing, props.name]);
  const rest = omit(props, { name: 1, icon: 1, size: 1, className: 1, style: 1 });
  const labelled = rest["aria-label"] || rest["aria-labelledby"];
  if (!labelled) rest["aria-hidden"] = true;
  else rest.role = "img";
  const style = Object.assign({}, props.style);
  if (props.size != null) style.fontSize = typeof props.size === "number" ? props.size + "px" : props.size;
  const name = props.icon ? props.icon.name : props.name;
  if (name != null) rest["data-icon"] = name;
  if (custom) {
    return /* @__PURE__ */ React.createElement("span", { ...rest, ref: restyle, className: cn("dk-icon dk-icon--custom", props.className), style }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, focusable: "false", dangerouslySetInnerHTML: { __html: ICONS[props.name] } }));
  }
  return /* @__PURE__ */ React.createElement("span", { ...rest, ref: restyle, className: cn("dk-icon", props.className), style }, data && /* @__PURE__ */ React.createElement("svg", { viewBox: "0 -960 960 960", fill: "currentColor", "aria-hidden": true, focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: data.d })));
});
export {
  Icon
};
//# sourceMappingURL=Icon.js.map
