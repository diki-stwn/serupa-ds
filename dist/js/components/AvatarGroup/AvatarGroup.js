"use client";

// src/components/AvatarGroup/AvatarGroup.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { AVATAR_SIZES, AvatarGroupSize } from "../Avatar/Avatar.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { flattenChildren } from "../../internal/children.js";
var OWN = { children: 1, max: 1, total: 1, size: 1, moreLabel: 1, label: 1, className: 1 };
var AvatarGroup = /* @__PURE__ */ component("AvatarGroup", function AvatarGroup2(props, ref) {
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const size = oneOf(AVATAR_SIZES, props.size, "md");
  const all = flattenChildren(props.children).filter(React.isValidElement);
  const max = props.max != null && props.max >= 0 ? Math.floor(props.max) : Infinity;
  const total = Math.max(all.length, props.total != null && props.total > 0 ? Math.floor(props.total) : 0);
  const shown = all.slice(0, max);
  const sds = useSerupa();
  const more = total - shown.length;
  const count = shown.length + (more > 0 ? 1 : 0);
  const cap = size === "xs" ? 9 : 99;
  if (props.label) rest["aria-label"] = props.label;
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
    more > 0 ? /* @__PURE__ */ React.createElement("span", { className: "dk-avatar-group__item", style: { zIndex: 1 } }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "dk-avatar dk-avatar--" + size + " dk-avatar-group__more",
        role: "img",
        "aria-label": (props.moreLabel || sds.labels.avatarMore)(more),
        "data-component": "avatar",
        "data-size": size
      },
      /* @__PURE__ */ React.createElement("span", { className: "dk-avatar__frame" }, /* @__PURE__ */ React.createElement("span", { className: "dk-avatar__initials", "aria-hidden": "true" }, more > cap ? cap + "+" : "+" + more))
    )) : null
  );
});
export {
  AvatarGroup
};
//# sourceMappingURL=AvatarGroup.js.map
