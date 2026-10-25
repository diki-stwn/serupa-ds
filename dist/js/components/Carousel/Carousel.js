"use client";

// src/components/Carousel/Carousel.tsx
import * as React from "react";
import { cn, omit, useIsoLayoutEffect } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { Icon } from "../Icon/Icon.js";
import { IconButton } from "../IconButton/IconButton.js";
import { component } from "../../internal/component.js";
import { flattenChildren } from "../../internal/children.js";
import { useSerupa } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
var OWN = { children: 1, label: 1, index: 1, defaultIndex: 1, onIndexChange: 1, loop: 1, arrows: 1, dots: 1, previousLabel: 1, nextLabel: 1, slideLabel: 1, className: 1, style: 1 };
var SWIPE = 40;
var Carousel = /* @__PURE__ */ component("Carousel", function Carousel2(props, ref) {
  const nameRef = useNameCheck("Carousel", NAME_HOW.label);
  const restyle = useServerStyles(ref);
  const sds = useSerupa();
  const rest = omit(props, OWN);
  const slides = flattenChildren(props.children);
  const count = slides.length;
  const clamp = (i) => Math.min(Math.max(0, Math.floor(i) || 0), Math.max(0, count - 1));
  const [own, setOwn] = React.useState(() => props.defaultIndex || 0);
  const controlled = props.index != null;
  const index = clamp(controlled ? props.index : own);
  const loop = !!props.loop && count > 1;
  const name = props.slideLabel || ((i, n) => sds.labels.slideOf(i + 1, n));
  const dotsRef = React.useRef(null);
  const viewport = React.useRef(null);
  const drag = React.useRef(null);
  const [offset, setOffset] = React.useState(0);
  const dragged = React.useRef(false);
  const prevBtn = React.useRef(null), nextBtn = React.useRef(null);
  const refocus = React.useRef(null);
  const go = (i) => {
    const next = loop ? (i % count + count) % count : clamp(i);
    if (next === index) return;
    if (!controlled) setOwn(next);
    if (props.onIndexChange) props.onIndexChange(next);
  };
  const rtl = () => !!viewport.current && getComputedStyle(viewport.current).direction === "rtl";
  const [dir, setDir] = React.useState("ltr");
  useIsoLayoutEffect(() => {
    const d = rtl() ? "rtl" : "ltr";
    if (d !== dir) setDir(d);
  });
  const onDotsKey = (e) => {
    const back = rtl() ? "ArrowRight" : "ArrowLeft", fwd = rtl() ? "ArrowLeft" : "ArrowRight";
    let to = -1;
    if (e.key === back) to = loop ? index - 1 : Math.max(0, index - 1);
    else if (e.key === fwd) to = loop ? index + 1 : Math.min(count - 1, index + 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = count - 1;
    else return;
    e.preventDefault();
    to = (to % count + count) % count;
    refocus.current = "dot";
    go(to);
  };
  const arrow = (step) => {
    const to = index + step;
    if (!loop && (to <= 0 || to >= count - 1)) refocus.current = step > 0 ? "prev" : "next";
    go(to);
  };
  useIsoLayoutEffect(() => {
    const r = refocus.current;
    refocus.current = null;
    if (r === "dot") dotsRef.current?.children[index]?.focus();
    else if (r && (document.activeElement === prevBtn.current || document.activeElement === nextBtn.current || document.activeElement === document.body)) (r === "prev" ? prevBtn : nextBtn).current?.focus();
  });
  const onPointerDown = (e) => {
    if (count < 2 || e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragged.current = false;
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (offset === 0 && Math.abs(dx) < 8) return;
    if (offset === 0 && Math.abs(e.clientY - d.y) > Math.abs(dx)) {
      drag.current = null;
      return;
    }
    if (offset === 0 && viewport.current) try {
      viewport.current.setPointerCapture(e.pointerId);
    } catch {
    }
    dragged.current = true;
    setOffset(dx);
  };
  const onPointerEnd = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = e.clientX - d.x;
    setOffset(0);
    if (Math.abs(dx) >= SWIPE) go(index + (dx < 0 !== rtl() ? 1 : -1));
  };
  const onPointerCancel = (e) => {
    if (drag.current && drag.current.id === e.pointerId) {
      drag.current = null;
      dragged.current = false;
      setOffset(0);
    }
  };
  const onPointerLeave = (e) => {
    if (offset === 0) onPointerCancel(e);
  };
  const style = { ...props.style, "--dk-carousel-index": index, "--dk-carousel-drag": offset + "px" };
  const track = React.useRef(null);
  useIsoLayoutEffect(() => {
    if (track.current) Array.from(track.current.children).forEach((el, i) => {
      el.inert = i !== index;
    });
  }, [index, count]);
  const prevOff = !loop && index === 0, nextOff = !loop && index >= count - 1;
  return /* @__PURE__ */ React.createElement(
    "section",
    {
      ...rest,
      ref: (n) => {
        restyle(n);
        nameRef(n);
      },
      className: cn("dk-carousel", props.className),
      style,
      "aria-roledescription": sds.labels.carouselRole,
      "aria-label": props.label,
      "data-component": "carousel",
      "data-index": index,
      "data-dir": dir
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "dk-carousel__viewport",
        ref: viewport,
        onPointerDown,
        onPointerMove,
        onPointerUp: onPointerEnd,
        onPointerCancel,
        onPointerLeave,
        onDragStart: (e) => e.preventDefault(),
        onClickCapture: (e) => {
          if (dragged.current && e.detail) {
            dragged.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        },
        "data-dragging": offset ? "" : void 0
      },
      /* @__PURE__ */ React.createElement("div", { className: "dk-carousel__track", ref: track, "aria-live": "polite" }, slides.map((s, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: s.key ?? i,
          className: "dk-carousel__slide",
          role: "group",
          "aria-roledescription": sds.labels.slideRole,
          "aria-label": name(i, count),
          "aria-hidden": i === index ? void 0 : true,
          "data-active": i === index ? "" : void 0
        },
        s
      ))),
      props.arrows !== false && count > 1 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        IconButton,
        {
          className: "dk-carousel__arrow dk-carousel__arrow--prev",
          label: props.previousLabel || sds.labels.previousSlide,
          size: "sm",
          variant: "secondary",
          shape: "round",
          noTitle: true,
          icon: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-carousel__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-carousel__rtl" })),
          ref: prevBtn,
          disabled: prevOff,
          onClick: () => arrow(-1)
        }
      ), /* @__PURE__ */ React.createElement(
        IconButton,
        {
          className: "dk-carousel__arrow dk-carousel__arrow--next",
          label: props.nextLabel || sds.labels.nextSlide,
          size: "sm",
          variant: "secondary",
          shape: "round",
          noTitle: true,
          icon: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-carousel__ltr" }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-carousel__rtl" })),
          ref: nextBtn,
          disabled: nextOff,
          onClick: () => arrow(1)
        }
      )) : null
    ),
    props.dots !== false && count > 1 ? /* @__PURE__ */ React.createElement("div", { className: "dk-carousel__dots", ref: dotsRef, onKeyDown: onDotsKey }, slides.map((_, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: i,
        type: "button",
        className: "dk-carousel__dot",
        "aria-label": name(i, count),
        "aria-current": i === index ? "true" : void 0,
        tabIndex: i === index ? 0 : -1,
        onClick: () => go(i)
      }
    ))) : null
  );
});
export {
  Carousel
};
//# sourceMappingURL=Carousel.js.map
