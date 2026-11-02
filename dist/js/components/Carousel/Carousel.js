"use client";

// src/components/Carousel/Carousel.tsx
import * as React from "react";
import { cn, omit, useIsoLayoutEffect } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { Icon } from "../Icon/Icon.js";
import { IconButton } from "../IconButton/IconButton.js";
import { component } from "../../internal/component.js";
import { activeIn } from "../../internal/root.js";
import { flattenChildren } from "../../internal/children.js";
import { useSettings } from "../../internal/provider.js";
import * as icons from "../../material/builtin.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { en as words } from "./labels.js";
import { project, rubber, settleTime, speed, track as sample } from "../../internal/fling.js";
var WIDTHS = [["sm", 640], ["md", 768], ["lg", 1024]];
var whole = (n) => Math.max(1, Math.floor(Number(n)) || 1);
function perAt(per, count) {
  if (per == null || typeof per !== "object") return null;
  const cap = Math.max(1, count), out = { base: Math.min(whole(per.base), cap) };
  let n = out.base;
  for (const [k] of WIDTHS) {
    if (per[k] != null) n = Math.min(whole(per[k]), cap);
    out[k] = n;
  }
  return out;
}
function usePerView(per) {
  const map = per != null && typeof per === "object" ? per : null;
  const pick = () => {
    if (!map) return whole(per);
    let n2 = whole(map.base);
    for (const [k, w] of WIDTHS) if (map[k] != null && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: " + w + "px)").matches) n2 = whole(map[k]);
    return n2;
  };
  const [n, setN] = React.useState(() => map ? whole(map.base) : whole(per));
  const key = map ? [map.base, map.sm, map.md, map.lg].join() : String(whole(per));
  useIsoLayoutEffect(() => {
    setN(pick());
    if (!map || typeof window === "undefined" || !window.matchMedia) return;
    const mqs = WIDTHS.map(([, w]) => window.matchMedia("(min-width: " + w + "px)"));
    const on = () => setN(pick());
    mqs.forEach((m) => m.addEventListener("change", on));
    return () => mqs.forEach((m) => m.removeEventListener("change", on));
  }, [key]);
  return n;
}
var OWN = { children: 1, label: 1, index: 1, defaultIndex: 1, onIndexChange: 1, loop: 1, arrows: 1, dots: 1, previousLabel: 1, nextLabel: 1, slideLabel: 1, perView: 1, className: 1, style: 1 };
var SWIPE = 40;
var FLICK = 0.3;
var Carousel = /* @__PURE__ */ component("Carousel", function Carousel2(props, ref) {
  const nameRef = useNameCheck("Carousel", NAME_HOW.label);
  const restyle = useServerStyles(ref);
  const sds = useSettings(words);
  const rest = omit(props, OWN);
  const slides = flattenChildren(props.children);
  const count = slides.length;
  const per = Math.min(usePerView(props.perView), Math.max(1, count));
  const perMap = perAt(props.perView, count);
  const last = Math.max(0, count - per);
  const clamp = (i) => Math.min(Math.max(0, Math.floor(i) || 0), last);
  const [own, setOwn] = React.useState(() => props.defaultIndex || 0);
  const controlled = props.index != null;
  const index = clamp(controlled ? props.index : own);
  const loop = !!props.loop && last > 0;
  const pages = Math.ceil(count / per), page = index >= last ? pages - 1 : Math.floor(index / per);
  const pageStart = (k) => Math.min(k * per, last);
  const dotName = (k) => per > 1 ? sds.labels.slidesOf(pageStart(k) + 1, pageStart(k) + per, count) : name(k, count);
  const name = props.slideLabel || ((i, n) => sds.labels.slideOf(i + 1, n));
  const dotsRef = React.useRef(null);
  const viewport = React.useRef(null);
  const drag = React.useRef(null);
  const track = React.useRef(null);
  const [settle, setSettle] = React.useState(null);
  const [wrap, setWrap] = React.useState(null);
  const [snap, setSnap] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const dragged = React.useRef(false);
  const prevBtn = React.useRef(null), nextBtn = React.useRef(null);
  const refocus = React.useRef(null);
  const go = (i, ms = null) => {
    const next = loop ? (i % (last + 1) + last + 1) % (last + 1) : clamp(i);
    if (next === index) return;
    setSettle(ms);
    const moves = !!track.current && parseFloat(getComputedStyle(track.current).transitionDuration) > 0;
    if (loop && moves && !wrap && count >= 2 * per) {
      if (i === last + 1 && index === last) setWrap({ virt: count, edge: "after" });
      else if (i === -1 && index === 0) setWrap({ virt: -per, edge: "before" });
    }
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
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const back = rtl() ? "ArrowRight" : "ArrowLeft", fwd = rtl() ? "ArrowLeft" : "ArrowRight";
    let to = -1;
    if (e.key === back) to = loop ? page - 1 : Math.max(0, page - 1);
    else if (e.key === fwd) to = loop ? page + 1 : Math.min(pages - 1, page + 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = pages - 1;
    else return;
    e.preventDefault();
    to = (to % pages + pages) % pages;
    refocus.current = "dot";
    go(pageStart(to));
  };
  const arrow = (step) => {
    const to = index + step;
    if (!loop && (to <= 0 || to >= last)) refocus.current = step > 0 ? "prev" : "next";
    go(to);
  };
  useIsoLayoutEffect(() => {
    const r = refocus.current;
    refocus.current = null;
    if (r === "dot") dotsRef.current?.children[page]?.focus();
    else if (r) {
      const a = activeIn(viewport.current);
      if (!a || a === prevBtn.current || a === nextBtn.current || a === document.body) (r === "prev" ? prevBtn : nextBtn).current?.focus();
    }
  });
  const onPointerDown = (e) => {
    if (last < 1 || e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, s: [{ t: e.timeStamp, p: e.clientX }] };
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
    sample(d.s, e.timeStamp, e.clientX);
    const forward = dx < 0 !== rtl(), w = viewport.current ? viewport.current.clientWidth : 0;
    setOffset(!loop && (forward ? index >= last : index <= 0) ? rubber(dx, w) : dx);
  };
  const onPointerEnd = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = e.clientX - d.x;
    const v = speed(d.s);
    const flick = Math.abs(dx) > 10 && Math.abs(v) > FLICK && Math.sign(v) === Math.sign(dx);
    const step = (viewport.current ? viewport.current.clientWidth : 0) / per;
    const to = dx + project(v);
    setOffset(0);
    if (flick || Math.abs(dx) >= SWIPE && Math.sign(to) === Math.sign(dx) && Math.abs(to) >= SWIPE) {
      const n = Math.max(1, Math.min(Math.floor(per), Math.round(Math.abs(to) / Math.max(1, step))));
      const ms = settleTime(Math.max(0, n * step - Math.abs(dx)), Math.sign(v) === Math.sign(dx) ? v : 0);
      setSettle(ms);
      go(index + n * (dx < 0 !== rtl() ? 1 : -1), ms);
    } else setSettle(offset ? settleTime(offset, 0) : null);
  };
  const onTrackEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform" || !wrap) return;
    setSnap(true);
    setWrap(null);
  };
  React.useEffect(() => {
    if (!snap) return;
    let f = requestAnimationFrame(() => {
      f = requestAnimationFrame(() => setSnap(false));
    });
    return () => cancelAnimationFrame(f);
  }, [snap]);
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
  const style = {
    ...props.style,
    "--dk-carousel-index": wrap ? wrap.virt : index,
    "--dk-carousel-count": count,
    ...settle != null ? { "--dk-carousel-settle": settle + "ms", "--dk-carousel-ease": "var(--ease-fling)" } : null,
    ...perMap ? { "--dk-carousel-per-base": perMap.base, "--dk-carousel-per-sm": perMap.sm, "--dk-carousel-per-md": perMap.md, "--dk-carousel-per-lg": perMap.lg } : { "--dk-carousel-per": per },
    "--dk-carousel-drag": offset + "px"
  };
  const multi = perMap ? Math.max(perMap.base, perMap.sm, perMap.md, perMap.lg) > 1 : per > 1;
  const pastAt = (k) => perMap ? ["sm", "md", "lg"].filter((b) => k >= Math.ceil(count / perMap[b])).join(" ") || void 0 : void 0;
  const shown = (i) => i >= index && i < index + per;
  const prevOff = !loop && index === 0, nextOff = !loop && index >= last;
  return /* @__PURE__ */ React.createElement(
    "section",
    {
      ...rest,
      ref: (n) => {
        restyle(n);
        nameRef(n);
      },
      className: cn("dk-carousel", multi && "dk-carousel--multi", props.className),
      style,
      "aria-roledescription": sds.labels.carouselRole,
      "aria-label": props.label ?? rest["aria-label"],
      "data-component": "carousel",
      "data-index": index,
      "data-dir": dir,
      "data-per-map": perMap ? "" : void 0
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
      /* @__PURE__ */ React.createElement("div", { className: "dk-carousel__track", "aria-live": "polite", ref: track, onTransitionEnd: onTrackEnd, "data-snap": snap ? "" : void 0 }, slides.map((s, i) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: s.key ?? i,
          className: "dk-carousel__slide",
          role: "group",
          "aria-roledescription": sds.labels.slideRole,
          "aria-label": name(i, count),
          "aria-hidden": shown(i) ? void 0 : true,
          inert: !shown(i),
          "data-active": shown(i) ? "" : void 0,
          "data-wrap": wrap && (wrap.edge === "after" ? i < per : i >= count - per) ? wrap.edge : void 0
        },
        s
      ))),
      props.arrows !== false && last > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        IconButton,
        {
          className: "dk-carousel__arrow dk-carousel__arrow--prev",
          label: props.previousLabel || sds.labels.previousSlide,
          size: "sm",
          variant: "secondary",
          shape: "round",
          hideTitle: true,
          icon: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-carousel__ltr", mirror: false }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-carousel__rtl", mirror: false })),
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
          hideTitle: true,
          icon: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronRight, className: "dk-carousel__ltr", mirror: false }), /* @__PURE__ */ React.createElement(Icon, { icon: icons.ChevronLeft, className: "dk-carousel__rtl", mirror: false })),
          ref: nextBtn,
          disabled: nextOff,
          onClick: () => arrow(1)
        }
      )) : null
    ),
    props.dots !== false && last > 0 ? /* @__PURE__ */ React.createElement("div", { className: "dk-carousel__dots", ref: dotsRef, onKeyDown: onDotsKey }, Array.from({ length: pages }, (_, k) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: k,
        type: "button",
        className: "dk-carousel__dot",
        "aria-label": dotName(k),
        "aria-current": k === page ? "true" : void 0,
        tabIndex: k === page ? 0 : -1,
        "data-past": pastAt(k),
        onClick: () => go(pageStart(k))
      }
    ))) : null
  );
});
export {
  Carousel
};
//# sourceMappingURL=Carousel.js.map
