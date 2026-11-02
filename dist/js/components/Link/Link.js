// src/components/Link/Link.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { warnOnce } from "../../internal/warn.js";
import { Icon } from "../Icon/Icon.js";
import { NewTabNote } from "./NewTabNote.js";
import { component } from "../../internal/component.js";
import { AutoFocusLink } from "./AutoFocusLink.js";
import * as icons from "../../material/builtin.js";
var LinkBase = /* @__PURE__ */ component("Link", function Link(props, ref) {
  const rest = omit(props, { tone: 1, underline: 1, external: 1, as: 1, className: 1, children: 1, autoFocus: 1 });
  const tone = oneOf(["primary", "neutral"], props.tone, "primary");
  const underline = oneOf(["always", "hover"], props.underline, "always");
  if (process.env.NODE_ENV !== "production" && tone === "neutral" && underline === "hover") warnOnce("link-neutral-hover", 'Link: tone="neutral" with underline="hover" looks like plain text until it is hovered. Keep the underline, or use tone="primary" in a place that already says it holds links.');
  if (props.external) {
    if (rest.target == null) rest.target = "_blank";
    rest.rel = cn(rest.rel, "noopener noreferrer");
  }
  const attrs = Object.assign(rest, {
    "data-component": "link",
    className: cn("dk-link", tone === "neutral" && "dk-link--neutral", underline === "hover" && "dk-link--hover-underline", props.className)
  });
  const icon = /* @__PURE__ */ React.createElement(Icon, { icon: icons.OpenInNew, className: "dk-link__icon" });
  const text = typeof props.children === "string" ? props.children : null;
  const cut = text != null ? text.search(/\S\p{M}*\s*$/u) : -1;
  const newTab = props.external && !/^_(self|parent|top)$/i.test(String(rest.target));
  const children = newTab ? /* @__PURE__ */ React.createElement(React.Fragment, null, cut > 0 ? text.slice(0, cut) : cut < 0 ? props.children : null, cut >= 0 ? /* @__PURE__ */ React.createElement("span", { className: "dk-link__last" }, text.slice(cut), icon) : icon, /* @__PURE__ */ React.createElement(NewTabNote, null)) : props.children;
  if (props.autoFocus) return /* @__PURE__ */ React.createElement(AutoFocusLink, { as: props.as || config.link, linkRef: ref, attrs }, children);
  return React.createElement(props.as || config.link, Object.assign(attrs, { ref }), children);
});
var Link2 = LinkBase;
export {
  Link2 as Link
};
//# sourceMappingURL=Link.js.map
