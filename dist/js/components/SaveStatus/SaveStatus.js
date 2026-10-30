"use client";

// src/components/SaveStatus/SaveStatus.tsx
import * as React from "react";
import { cn, oneOf } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { announce } from "../../internal/announce.js";
import { Icon } from "../Icon/Icon.js";
import { Loader } from "../Loader/Loader.js";
import { Button } from "../Button/Button.js";
import { RelativeTime } from "../RelativeTime/RelativeTime.js";
import * as icons from "../../material/builtin.js";
import { en as words } from "./labels.js";
var STATES = ["idle", "saving", "saved", "error"];
var SaveStatus = /* @__PURE__ */ component("SaveStatus", function SaveStatus2(props, ref) {
  const sds = useSettings(words);
  const { status: _s, savedAt, onRetry, errorText, className, ...rest } = props;
  const status = oneOf(STATES, props.status, "idle");
  const text = React.useRef(null);
  const before = React.useRef(status);
  React.useEffect(() => {
    const was = before.current;
    before.current = status;
    if (was === status) return;
    if (status === "saved") announce(sds.labels.saved);
    else if (status === "error" && text.current) announce(text.current.textContent || sds.labels.saveFailed);
  }, [status, sds.labels]);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cn("dk-save-status", "dk-save-status--" + status, className), "data-component": "save-status", "data-state": status }, status === "saving" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader, { className: "dk-save-status__icon", size: "sm", label: "", delay: 0 }), /* @__PURE__ */ React.createElement("span", { className: "dk-save-status__text" }, sds.labels.saving)) : null, status === "saved" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { className: "dk-save-status__icon", icon: icons.Check }), /* @__PURE__ */ React.createElement("span", { className: "dk-save-status__text" }, sds.labels.saved, savedAt != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement(RelativeTime, { date: savedAt })) : null)) : null, status === "error" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { className: "dk-save-status__icon", icon: icons.Error }), /* @__PURE__ */ React.createElement("span", { className: "dk-save-status__text", ref: text }, errorText != null ? errorText : sds.labels.saveFailed), onRetry ? /* @__PURE__ */ React.createElement(Button, { className: "dk-save-status__retry", variant: "link", size: "sm", onClick: () => onRetry() }, sds.labels.retrySave) : null) : null);
});
export {
  SaveStatus
};
//# sourceMappingURL=SaveStatus.js.map
