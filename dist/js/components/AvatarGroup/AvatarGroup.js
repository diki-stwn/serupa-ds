"use client";

// src/components/AvatarGroup/AvatarGroup.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { AVATAR_SIZES, AvatarGroupSize } from "../Avatar/Avatar.js";
import { component } from "../../internal/component.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { displayNumber } from "../../internal/numbers.js";
import { flattenChildren } from "../../internal/children.js";
import { Popover } from "../Popover/Popover.js";
import { en as words } from "./labels.js";
var PLAIN = { useGrouping: false };
var OWN = { children: 1, max: 1, total: 1, size: 1, moreLabel: 1, label: 1, showMore: 1, onMore: 1, className: 1 };
var AvatarGroup = /* @__PURE__ */ component("AvatarGroup", function AvatarGroup2(props, ref) {
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const size = oneOf(AVATAR_SIZES, props.size, "md");
  const all = flattenChildren(props.children).filter(React.isValidElement);
  const max = props.max != null && props.max >= 0 ? Math.floor(props.max) : Infinity;
  const total = Math.max(all.length, props.total != null && props.total > 0 ? Math.floor(props.total) : 0);
  const shown = all.slice(0, max);
  const sds = useSettings(words), locale = useLocale();
  const more = total - shown.length;
  const count = shown.length + (more > 0 ? 1 : 0);
  const cap = size === "xs" ? 9 : 99;
  if (props.label) rest["aria-label"] = props.label;
  const moreName = (props.moreLabel || sds.labels.avatarMore)(more);
  const digits = (n) => displayNumber(n, locale, PLAIN);
  const face = /* @__PURE__ */ React.createElement("span", { className: "dk-avatar__frame" }, /* @__PURE__ */ React.createElement("span", { className: "dk-avatar__initials", "aria-hidden": "true" }, more > cap ? digits(cap) + "+" : "+" + digits(more)));
  const cls = "dk-avatar dk-avatar--" + size + " dk-avatar-group__more";
  const plus = (onClick) => props.onMore || props.showMore ? /* @__PURE__ */ React.createElement("button", { type: "button", className: cls, "aria-label": moreName, onClick, "data-component": "avatar", "data-size": size }, face) : /* @__PURE__ */ React.createElement("span", { className: cls, role: "img", "aria-label": moreName, "data-component": "avatar", "data-size": size }, face);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: restyle,
      role: "group",
      className: cn("dk-avatar-group", "dk-avatar-group--" + size, props.className),
      "data-component": "avatar-group",
      "data-size": size
    },
    /* @__PURE__ */ React.createElement(AvatarGroupSize.Provider, { value: size }, shown.map((el, i) => /* @__PURE__ */ React.createElement("span", { key: el.key ?? i, className: "dk-avatar-group__item", style: { zIndex: count - i } }, el))),
    more > 0 ? /* @__PURE__ */ React.createElement("span", { className: "dk-avatar-group__item", style: { zIndex: 1 } }, props.onMore || !props.showMore ? plus(props.onMore) : /* @__PURE__ */ React.createElement(Popover, { trigger: plus(), "aria-label": moreName, placement: "bottom-start" }, /* @__PURE__ */ React.createElement("ul", { className: "dk-avatar-group__list", role: "list" }, all.slice(shown.length).map((el, i) => {
      const name = el.props.name;
      return /* @__PURE__ */ React.createElement("li", { key: el.key ?? i }, name ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AvatarGroupSize.Provider, { value: "xs" }, React.cloneElement(el, { alt: "" })), name) : el);
    }), total > all.length ? /* @__PURE__ */ React.createElement("li", null, (props.moreLabel || sds.labels.avatarMore)(total - all.length)) : null))) : null
  );
});
export {
  AvatarGroup
};
//# sourceMappingURL=AvatarGroup.js.map
