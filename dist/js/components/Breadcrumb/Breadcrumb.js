"use client";

// src/components/Breadcrumb/Breadcrumb.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { flattenChildren } from "../../internal/children.js";
import { useSerupa } from "../../internal/provider.js";
import { Menu, MenuItem } from "../Menu/Menu.js";
import * as icons from "../../material/builtin.js";
var BreadcrumbItem = /* @__PURE__ */ component("BreadcrumbItem", function BreadcrumbItem2(props, ref) {
  const rest = omit(props, { icon: 1, as: 1, current: 1, className: 1, children: 1 });
  const content = /* @__PURE__ */ React.createElement(React.Fragment, null, props.icon ? /* @__PURE__ */ React.createElement("span", { className: "dk-breadcrumb__icon" }, asIcon(props.icon)) : null, props.children);
  if (props.current) {
    delete rest.href;
    return /* @__PURE__ */ React.createElement("span", { ...rest, ref, "aria-current": "page", className: cn("dk-breadcrumb__item dk-breadcrumb__item--current", props.className) }, content);
  }
  return React.createElement(props.as || config.link, Object.assign(rest, { ref, className: cn("dk-breadcrumb__item dk-breadcrumb__link", props.className) }), content);
});
var Breadcrumb = /* @__PURE__ */ component("Breadcrumb", function Breadcrumb2(props, ref) {
  const sds = useSerupa();
  const rest = omit(props, { separator: 1, maxItems: 1, collapse: 1, expandLabel: 1, className: 1, children: 1 });
  const asMenu = props.collapse === "menu";
  const separator = oneOf(["chevron", "slash"], props.separator, "chevron");
  const [expanded, setExpanded] = React.useState(false);
  const firstHidden = React.useRef(null);
  const focusAfter = React.useRef(false);
  const items = flattenChildren(props.children).filter(React.isValidElement);
  const max = typeof props.maxItems === "number" && props.maxItems >= 2 ? Math.floor(props.maxItems) : 0;
  const collapse = !expanded && max > 0 && items.length > max;
  const shown = items.map((el, i) => ({ el, i })).filter(({ i }) => !collapse || i === 0 || i >= items.length - (max - 1));
  React.useEffect(() => {
    if (expanded && focusAfter.current && firstHidden.current) {
      focusAfter.current = false;
      const a = firstHidden.current.querySelector("a, [tabindex], button");
      if (a) a.focus();
    }
  }, [expanded]);
  const sep = /* @__PURE__ */ React.createElement("span", { className: "dk-breadcrumb__separator", "aria-hidden": "true" }, separator === "slash" ? "/" : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-breadcrumb__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-breadcrumb__rtl" })));
  const out = [];
  shown.forEach(({ el, i }, n) => {
    if (collapse && n === 1) {
      const label = props.expandLabel || (asMenu ? sds.labels.morePages : sds.labels.showHiddenPages);
      const more = /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "dk-breadcrumb__item dk-breadcrumb__more",
          "aria-label": label,
          onClick: asMenu ? void 0 : () => {
            focusAfter.current = true;
            setExpanded(true);
          }
        },
        "\u2026"
      );
      out.push(/* @__PURE__ */ React.createElement("li", { key: "more", className: "dk-breadcrumb__li" }, sep, asMenu ? /* @__PURE__ */ React.createElement(Menu, { trigger: more, "aria-label": label }, items.slice(1, items.length - (max - 1)).map((h, k) => /* @__PURE__ */ React.createElement(MenuItem, { key: h.key != null ? h.key : k, href: h.props.href, as: h.props.as, icon: h.props.icon }, h.props.children))) : more));
    }
    const last = i === items.length - 1;
    out.push(/* @__PURE__ */ React.createElement("li", { key: el.key != null ? el.key : i, className: "dk-breadcrumb__li", ref: expanded && max > 0 && i === 1 ? firstHidden : void 0 }, n > 0 ? sep : null, React.cloneElement(el, { current: last || el.props.current })));
  });
  return /* @__PURE__ */ React.createElement("nav", { "aria-label": sds.labels.breadcrumb, ...rest, ref, "data-component": "breadcrumb", className: cn("dk-breadcrumb", props.className) }, /* @__PURE__ */ React.createElement("ol", { className: "dk-breadcrumb__list" }, out));
});
export {
  Breadcrumb,
  BreadcrumbItem
};
//# sourceMappingURL=Breadcrumb.js.map
