"use client";

// src/components/Card/Card.tsx
import * as React from "react";
import { cn, domId, oneOf, omit } from "../../internal/cn.js";
import { config } from "../../internal/config.js";
import { component } from "../../internal/component.js";
var INTERACTIVE = "a[href], button, input, select, textarea, label, summary, [tabindex]";
var OWN = { variant: 1, padding: 1, as: 1, className: 1, href: 1, target: 1, rel: 1, children: 1 };
var CardLinkContext = /* @__PURE__ */ React.createContext(null);
var VARIANTS = ["outline", "elevated", "filled"];
var PADDINGS = ["none", "sm", "md", "lg"];
var TAGS = ["div", "section", "article", "li"];
var Card = /* @__PURE__ */ component("Card", function Card2(props, ref) {
  const rest = omit(props, OWN);
  const variant = oneOf(VARIANTS, props.variant, "outline");
  const padding = oneOf(PADDINGS, props.padding, "md");
  const base = domId("dk-card", React.useId());
  const isLink = props.href != null;
  const cls = cn("dk-card", variant !== "outline" && "dk-card--" + variant, padding !== "md" && "dk-card--padding-" + padding, isLink && "dk-card--link", props.className);
  const tag = oneOf(TAGS, props.as, "div");
  const inLink = React.useContext(CardLinkContext) != null;
  if (!isLink) return React.createElement(
    tag,
    Object.assign(rest, { ref, className: cls, "data-component": "card", "data-variant": variant }),
    inLink ? /* @__PURE__ */ React.createElement(CardLinkContext.Provider, { value: null }, props.children) : props.children
  );
  const link = { href: props.href, target: props.target, rel: props.target === "_blank" && props.rel == null ? "noopener noreferrer" : props.rel, "aria-label": rest["aria-label"] };
  delete rest["aria-label"];
  const titled = React.Children.toArray(props.children).some((c) => React.isValidElement(c) && c.type === CardHeader && hasContent(c.props.title));
  const id = rest.id || base;
  const own = rest.onClick;
  const ownAux = rest.onAuxClick;
  const target = (e) => {
    const t = e.target;
    if (e.defaultPrevented || !(t instanceof Element) || t.closest(INTERACTIVE)) return null;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && e.currentTarget.contains(sel.anchorNode)) return null;
    return e.currentTarget.querySelector(".dk-card__link");
  };
  const away = (a) => {
    if (/^(https?|mailto|tel):$/.test(a.protocol)) window.open(a.href, "_blank", "noopener");
  };
  const onClick = (e) => {
    if (own) own(e);
    const a = target(e);
    if (!a) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) away(a);
    else a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, altKey: e.altKey }));
  };
  const onAuxClick = (e) => {
    if (ownAux) ownAux(e);
    const a = e.button === 1 ? target(e) : null;
    if (a) away(a);
  };
  return React.createElement(
    tag,
    Object.assign(rest, { id, ref, className: cls, "data-component": "card", "data-variant": variant, onClick, onAuxClick }),
    titled ? null : React.createElement(config.link, { ...link, className: "dk-card__link dk-card__link--cover", "aria-labelledby": link["aria-label"] ? void 0 : id, key: "link" }),
    /* @__PURE__ */ React.createElement(CardLinkContext.Provider, { value: titled ? link : null, key: "content" }, props.children)
  );
});
var hasContent = (n) => n != null && n !== false && n !== "";
var CardHeader = /* @__PURE__ */ component("CardHeader", function CardHeader2(props, ref) {
  const rest = omit(props, { title: 1, description: 1, action: 1, headingLevel: 1, className: 1, children: 1 });
  const level = [2, 3, 4, 5, 6].indexOf(props.headingLevel) < 0 ? 3 : props.headingLevel;
  const has = hasContent;
  const link = React.useContext(CardLinkContext);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-card__header", props.className) }, /* @__PURE__ */ React.createElement("div", { className: "dk-card__heading" }, has(props.title) ? React.createElement("h" + level, { className: "dk-card__title" }, link ? React.createElement(config.link, { ...link, className: "dk-card__link" }, props.title) : props.title) : null, has(props.description) ? /* @__PURE__ */ React.createElement("p", { className: "dk-card__description" }, props.description) : null, props.children), has(props.action) ? /* @__PURE__ */ React.createElement("div", { className: "dk-card__action" }, props.action) : null);
});
var CardBody = /* @__PURE__ */ component("CardBody", function CardBody2(props, ref) {
  return /* @__PURE__ */ React.createElement("div", { ...props, ref, className: cn("dk-card__body", props.className) });
});
var CardFooter = /* @__PURE__ */ component("CardFooter", function CardFooter2(props, ref) {
  const rest = omit(props, { justify: 1, className: 1 });
  const j = oneOf(["start", "end", "between"], props.justify, "end");
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-card__footer", j !== "end" && "dk-card__footer--" + j, props.className) });
});
export {
  Card,
  CardBody,
  CardFooter,
  CardHeader
};
//# sourceMappingURL=Card.js.map
