"use client";

// src/components/CopyButton/CopyButton.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { ButtonBase } from "../Button/Button.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { announce } from "../../internal/announce.js";
import * as icons from "../../material/builtin.js";
async function write(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (e) {
      if (!fallback(text)) throw e;
      return;
    }
  }
  if (!fallback(text)) throw new Error("Copying isn't available here.");
}
function fallback(text) {
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  ta.style.insetInlineStart = "-9999px";
  const back = document.activeElement;
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  if (back && back.focus) back.focus();
  return ok;
}
var CopyButton = /* @__PURE__ */ component("CopyButton", function CopyButton2(props, ref) {
  const sds = useSerupa();
  const { value, children, copiedLabel, iconOnly, timeout, onCopy, onCopyError, className, variant, size, ...rest } = props;
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const label = children == null || children === false ? sds.labels.copy : children;
  const done = copiedLabel || sds.labels.copied;
  const name = typeof label === "string" ? label : sds.labels.copy;
  const onClick = async (e) => {
    if (props.onClick) props.onClick(e);
    if (e.defaultPrevented) return;
    try {
      const text = typeof value === "function" ? await value() : value;
      await write(text);
      setCopied(true);
      announce(done);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout ?? 2e3);
      if (onCopy) onCopy(text);
    } catch (err) {
      announce(sds.labels.copyFailed, { assertive: true });
      if (onCopyError) onCopyError(err);
    }
  };
  const glyph = /* @__PURE__ */ React.createElement(Icon, { icon: copied ? icons.Check : icons.ContentCopy, className: cn("dk-copy-btn__icon", copied && "dk-copy-btn__icon--done") });
  const common = {
    ...rest,
    ref,
    onClick,
    variant: variant || "outline",
    size: size || "sm",
    "data-copied": copied ? "" : void 0,
    className: cn("dk-copy-btn", copied && "dk-copy-btn--copied", className)
  };
  if (iconOnly) return /* @__PURE__ */ React.createElement(ButtonBase, { ...common, icon: glyph, "aria-label": copied ? done : name, title: rest.title ?? name });
  return /* @__PURE__ */ React.createElement(ButtonBase, { ...common, leftIcon: glyph }, /* @__PURE__ */ React.createElement("span", { className: "dk-copy-btn__labels" }, /* @__PURE__ */ React.createElement("span", { className: cn("dk-copy-btn__label", copied && "dk-copy-btn__label--off"), "aria-hidden": copied || void 0 }, label), /* @__PURE__ */ React.createElement("span", { className: cn("dk-copy-btn__label", !copied && "dk-copy-btn__label--off"), "aria-hidden": !copied || void 0 }, done)));
});
export {
  CopyButton
};
//# sourceMappingURL=CopyButton.js.map
