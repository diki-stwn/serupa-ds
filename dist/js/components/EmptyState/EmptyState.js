// src/components/EmptyState/EmptyState.tsx
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn.js";
import { asIcon } from "../Icon/asIcon.js";
import { component } from "../../internal/component.js";
import { AnnounceText } from "./AnnounceText.js";
import { ClearFilters, Suggestions } from "./NoResults.js";
var EmptyState = /* @__PURE__ */ component("EmptyState", function EmptyState2(props, ref) {
  const rest = omit(props, { icon: 1, title: 1, description: 1, actions: 1, size: 1, variant: 1, headingLevel: 1, announce: 1, suggestions: 1, onSuggestion: 1, onClearFilters: 1, className: 1 });
  const size = oneOf(["sm", "md"], props.size, "md");
  const variant = oneOf(["plain", "dashed"], props.variant, "plain");
  const level = [2, 3, 4, 5, 6].indexOf(props.headingLevel) >= 0 ? props.headingLevel : 3;
  const H = "h" + level;
  const icon = asIcon(props.icon);
  const suggestions = (props.suggestions || []).filter(Boolean);
  const clear = props.onClearFilters ? /* @__PURE__ */ React.createElement(ClearFilters, { action: props.onClearFilters, small: size === "sm" }) : null;
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, "data-component": "empty-state", className: cn("dk-empty-state", size === "sm" && "dk-empty-state--sm", variant === "dashed" && "dk-empty-state--dashed", props.className) }, icon != null ? /* @__PURE__ */ React.createElement("div", { className: cn("dk-empty-state__icon", typeof props.icon !== "string" && "dk-empty-state__icon--custom"), "aria-hidden": "true" }, icon) : null, /* @__PURE__ */ React.createElement("div", { className: "dk-empty-state__text" }, /* @__PURE__ */ React.createElement(H, { className: "dk-empty-state__title" }, props.title), props.description != null ? /* @__PURE__ */ React.createElement("p", { className: "dk-empty-state__description" }, props.description) : null, suggestions.length ? /* @__PURE__ */ React.createElement(Suggestions, { items: suggestions, pick: props.onSuggestion }) : null, props.announce ? /* @__PURE__ */ React.createElement(AnnounceText, null) : null), props.actions != null || clear ? /* @__PURE__ */ React.createElement("div", { className: "dk-empty-state__actions" }, props.actions, clear) : null);
});
export {
  EmptyState
};
//# sourceMappingURL=EmptyState.js.map
