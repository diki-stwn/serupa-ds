"use client";

// src/components/EmptyState/NoResults.tsx
import * as React from "react";
import { buttonClass } from "../Button/buttonClass.js";
import { asIcon } from "../Icon/asIcon.js";
import { useSettings } from "../../internal/provider.js";
import { en as words } from "./labels.js";
function Suggestions(props) {
  const labels = useSettings(words).labels;
  return /* @__PURE__ */ React.createElement("p", { className: "dk-empty-state__suggestions" }, /* @__PURE__ */ React.createElement("span", null, labels.didYouMean), props.items.map((s) => props.pick ? /* @__PURE__ */ React.createElement("button", { key: s, type: "button", className: buttonClass({ variant: "link", size: "sm", className: "dk-empty-state__suggestion" }), onClick: () => props.pick(s) }, s) : /* @__PURE__ */ React.createElement("strong", { key: s, className: "dk-empty-state__suggestion" }, s)));
}
function ClearFilters(props) {
  const labels = useSettings(words).labels;
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: buttonClass({ variant: "outline", size: props.small ? "sm" : "md", iconPosition: "left" }), onClick: props.action }, asIcon("filter_alt_off"), labels.clearFilters);
}
export {
  ClearFilters,
  Suggestions
};
//# sourceMappingURL=NoResults.js.map
