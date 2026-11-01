"use client";

// src/components/List/List.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
var List = /* @__PURE__ */ component("List", function List2(props, ref) {
  const rest = omit(props, { variant: 1, divided: 1, as: 1, className: 1 });
  const variant = oneOf(["plain", "card"], props.variant, "plain");
  return React.createElement(oneOf(["ul", "ol"], props.as, "ul"), Object.assign(rest, {
    ref,
    "data-component": "list",
    role: rest.role ?? "list",
    className: cn("dk-list", variant === "card" && "dk-list--card", props.divided !== false && "dk-list--divided", props.className)
  }));
});
var ListItem = /* @__PURE__ */ component("ListItem", function ListItem2(props, ref) {
  const rest = omit(props, { title: 1, description: 1, leading: 1, trailing: 1, href: 1, onClick: 1, as: 1, linkProps: 1, selected: 1, disabled: 1, className: 1 });
  const lead = asIcon(props.leading);
  const body = /* @__PURE__ */ React.createElement(React.Fragment, null, lead != null && lead !== false ? /* @__PURE__ */ React.createElement("span", { className: cn("dk-list__leading", typeof props.leading === "string" && "dk-list__leading--icon") }, lead) : null, /* @__PURE__ */ React.createElement("span", { className: "dk-list__text" }, /* @__PURE__ */ React.createElement("span", { className: "dk-list__title" }, props.title), props.description != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-list__description" }, props.description) : null));
  const lp = Object.assign({}, props.linkProps);
  let main;
  if (props.href != null || props.as) {
    const attrs = Object.assign(lp, { className: cn("dk-list__main", lp.className), "aria-current": lp["aria-current"] !== void 0 ? lp["aria-current"] : props.selected ? "true" : void 0 });
    const keep = (k) => /^(aria-|data-)/.test(k) || k === "id" || k === "title" || k === "style" || k === "className" || k === "lang" || k === "dir";
    if (props.disabled) {
      for (const k of Object.keys(attrs)) if (!keep(k)) delete attrs[k];
      Object.assign(attrs, { "aria-disabled": true, tabIndex: -1, onClick: (e) => e.preventDefault() });
    } else {
      attrs.href = props.href;
      if (props.onClick) attrs.onClick = props.onClick;
    }
    main = React.createElement(props.disabled ? "a" : props.as || config.link, attrs, body);
  } else if (props.onClick) {
    main = /* @__PURE__ */ React.createElement("button", { type: "button", ...lp, className: cn("dk-list__main", lp.className), onClick: props.onClick, disabled: props.disabled, "aria-pressed": props.selected === void 0 ? void 0 : !!props.selected }, body);
  } else {
    main = /* @__PURE__ */ React.createElement("div", { className: "dk-list__main dk-list__main--static" }, body);
  }
  const interactive = props.href != null || !!props.as || !!props.onClick;
  return /* @__PURE__ */ React.createElement("li", { ...rest, ref, className: cn("dk-list__item", interactive && "dk-list__item--interactive", props.selected && "dk-list__item--selected", props.disabled && "dk-list__item--disabled", props.className) }, main, props.trailing != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-list__trailing" }, props.trailing) : null);
});
export {
  List,
  ListItem
};
//# sourceMappingURL=List.js.map
