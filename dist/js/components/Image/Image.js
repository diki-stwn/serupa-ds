"use client";

// src/components/Image/Image.tsx
import * as React from "react";
import { cn, oneOf, setRef } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { Dialog } from "../Dialog/Dialog.js";
import { Icon } from "../Icon/Icon.js";
import { IconButton } from "../IconButton/IconButton.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { warnOnce } from "../../internal/warn.js";
import * as icons from "../../material/builtin.js";
var RATIOS = ["auto", "square", "4:3", "video"];
var Image = /* @__PURE__ */ component("Image", function Image2(props, ref) {
  const restyle = useServerStyles();
  const sds = useSerupa();
  const { src, alt, ratio: _r, fit: _f, rounded, fallback, viewable, fullSrc, viewLabel, onRemove, removeLabel, frameProps, className, onLoad, onError, loading, priority, decoding, fetchPriority, ...rest } = props;
  const ratio = typeof props.ratio === "number" && props.ratio > 0 ? props.ratio : oneOf(RATIOS, props.ratio, "auto");
  const fit = oneOf(["cover", "contain"], props.fit, "cover");
  const [state, setState] = React.useState("loading");
  const [open, setOpen] = React.useState(false);
  const img = React.useRef(null);
  React.useEffect(() => {
    setState("loading");
  }, [src]);
  React.useEffect(() => {
    const i = img.current;
    if (i && i.complete) setState(i.naturalWidth > 0 ? "loaded" : "error");
  }, [src]);
  const named = (base) => alt ? base + ": " + alt : base;
  const w = Number(props.width), h = Number(props.height);
  const sized = ratio === "auto" && w > 0 && h > 0;
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && ratio === "auto" && !sized) warnOnce("image-size", `Image: with ratio "auto" and no width and height, the frame has no height until the picture loads, so the page jumps. Pass the picture's width and height, or a ratio.`);
  }, [ratio, sized]);
  const shape = typeof ratio === "number" ? { "--dk-image-ratio": String(ratio) } : sized ? { "--dk-image-ratio": w + " / " + h, width: w } : null;
  const frameStyle = shape ? { ...shape, ...frameProps && frameProps.style } : frameProps && frameProps.style;
  const picture = state === "error" ? /* @__PURE__ */ React.createElement("span", { className: "dk-image__fallback", role: alt ? "img" : void 0, "aria-label": alt || void 0, "aria-hidden": alt ? void 0 : true }, fallback != null ? fallback : /* @__PURE__ */ React.createElement(Icon, { icon: icons.BrokenImage })) : /* @__PURE__ */ React.createElement(
    "img",
    {
      ...rest,
      ref: (n) => {
        img.current = n;
        setRef(ref, n);
      },
      src,
      alt,
      loading: loading || (priority ? "eager" : "lazy"),
      decoding: decoding || "async",
      fetchPriority: fetchPriority || (priority ? "high" : void 0),
      className: cn("dk-image__img", className),
      onLoad: (e) => {
        setState("loaded");
        if (onLoad) onLoad(e);
      },
      onError: (e) => {
        setState("error");
        if (onError) onError(e);
      }
    }
  );
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      ...frameProps,
      ref: restyle,
      style: frameStyle,
      className: cn("dk-image", "dk-image--ratio-" + (typeof ratio === "number" ? "custom" : ratio.replace(":", "-")), sized && "dk-image--sized", "dk-image--" + fit, rounded !== false && "dk-image--rounded", "dk-image--" + state, frameProps && frameProps.className),
      "data-component": "image",
      "data-state": state
    },
    viewable && state !== "error" ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "dk-image__view", "aria-label": viewLabel || named(sds.labels.viewImage), "aria-haspopup": "dialog", onClick: () => setOpen(true) }, picture) : picture,
    onRemove ? /* @__PURE__ */ React.createElement(IconButton, { className: "dk-image__remove", icon: icons.Close, label: removeLabel || named(sds.labels.removeImage), size: "sm", variant: "secondary", shape: "round", noTitle: true, onClick: onRemove }) : null,
    viewable ? /* @__PURE__ */ React.createElement(Dialog, { open, onOpenChange: setOpen, size: "lg", title: alt || void 0, "aria-label": alt ? void 0 : viewLabel || sds.labels.image, className: "dk-image__viewer" }, open ? /* @__PURE__ */ React.createElement("img", { src: fullSrc || src, alt, className: "dk-image__full" }) : null) : null
  );
});
export {
  Image
};
//# sourceMappingURL=Image.js.map
