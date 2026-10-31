"use client";
import * as React from "react";
import { cn, omit, useIsoLayoutEffect } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { Icon } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import { component } from "../../internal/component";
import { flattenChildren } from "../../internal/children";
import { useSettings } from "../../internal/provider";
import * as icons from "../../material/builtin";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { en as words } from "./labels";
import { project, rubber, settleTime, speed, track as sample, type Samples } from "../../internal/fling";

export interface CarouselProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** The slides, one per child (pictures, cards, anything). */
  children?: React.ReactNode;
  /** What the carousel shows, such as "Featured products": it names the region. Required unless you give aria-label, or aria-labelledby pointing at a visible heading. */
  label?: string;
  /** The slide shown (from 0), when you control it. */
  index?: number;
  /** The first slide shown when you don't control it. Default: 0. */
  defaultIndex?: number;
  /** Called with the new slide's index when the person moves to it. */
  onIndexChange?: (index: number) => void;
  /** Past the last slide comes the first, and before the first the last. Default: false (the buttons stop at the ends). */
  loop?: boolean;
  /** The previous and next buttons on the sides. Default: true. */
  arrows?: boolean;
  /** A dot for each slide under the carousel. Default: true. */
  dots?: boolean;
  /** The previous button's name. Default: "Previous slide". */
  previousLabel?: string;
  /** The next button's name. Default: "Next slide". */
  nextLabel?: string;
  /** Each slide's name, and its dot's, from the index (from 0) and the count. Default: the slideOf label, "2 of 5". */
  slideLabel?: (index: number, count: number) => string;
  /** How many slides show side by side: a number, or one per screen width, { base, sm, md, lg } (from 640, 768
      and 1024px up; each one holds until the next is set). Default: 1. Previous and next still move one slide,
      and with more than one the dots count pages. */
  perView?: number | CarouselPerView;
}
export interface CarouselPerView { base?: number; sm?: number; md?: number; lg?: number }

const WIDTHS = [["sm", 640], ["md", 768], ["lg", 1024]] as const;
const whole = (n: unknown) => Math.max(1, Math.floor(Number(n)) || 1);
/** The slides per view at the screen width now, following the matchMedia queries as the width changes. */
function usePerView(per: CarouselProps["perView"]): number {
  const map = per != null && typeof per === "object" ? per : null;
  const pick = () => {
    if (!map) return whole(per);
    let n = whole(map.base);
    for (const [k, w] of WIDTHS) if (map[k] != null && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: " + w + "px)").matches) n = whole(map[k]);
    return n;
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

/* Carousel: one slide at a time with previous and next buttons, a dot per slide and swipe. The outer
   <section> is a region named by label (aria-roledescription "carousel"); each slide is a group named
   "2 of 5", and the slides not shown are inert. It never moves on its own. Slides slide in from the side
   (at once with reduced motion), and the row runs right to left in RTL. className and every other prop go
   to the <section>. With perView, two or more slides show side by side: index is the first one shown, the
   buttons and swipe still move one slide, and the dots count pages. */
const OWN = { children: 1, label: 1, index: 1, defaultIndex: 1, onIndexChange: 1, loop: 1, arrows: 1, dots: 1, previousLabel: 1, nextLabel: 1, slideLabel: 1, perView: 1, className: 1, style: 1 } as const;
const SWIPE = 40; // px a swipe must travel to change the slide
const FLICK = 0.3; // px per ms over the last 100ms: a shorter swipe this fast changes the slide too

/** One slide at a time, with previous and next buttons, dots and swipe. */
export const Carousel = /* @__PURE__ */ component<HTMLElement, CarouselProps>("Carousel", function Carousel(props, ref) {
  const nameRef = useNameCheck("Carousel", NAME_HOW.label);   // warns when it has no accessible name
  const restyle = useServerStyles(ref);
  const sds = useSettings(words);
  const rest = omit(props, OWN);
  const slides = flattenChildren(props.children);
  const count = slides.length;
  const per = Math.min(usePerView(props.perView), Math.max(1, count));
  const last = Math.max(0, count - per);   // the last index: the first slide of the last full view
  const clamp = (i: number) => Math.min(Math.max(0, Math.floor(i) || 0), last);
  const [own, setOwn] = React.useState(() => props.defaultIndex || 0);
  const controlled = props.index != null;
  const index = clamp(controlled ? props.index! : own);
  const loop = !!props.loop && last > 0;
  // Pages for the dots: with 3 per view and 7 slides, 1–3, 4–6 and 5–7; a dot goes to its page's first slide.
  const pages = Math.ceil(count / per), page = index >= last ? pages - 1 : Math.floor(index / per);
  const pageStart = (k: number) => Math.min(k * per, last);
  const dotName = (k: number) => per > 1 ? sds.labels.slidesOf(pageStart(k) + 1, pageStart(k) + per, count) : name(k, count);
  const name = props.slideLabel || ((i: number, n: number) => sds.labels.slideOf(i + 1, n));
  const dotsRef = React.useRef<HTMLDivElement>(null);
  const viewport = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ x: number; y: number; id: number; s: Samples } | null>(null);
  const track = React.useRef<HTMLDivElement>(null);
  // How long the track takes to settle after a swipe (from the distance left and the speed); null: the CSS default.
  const [settle, setSettle] = React.useState<number | null>(null);
  // A loop going on past the last slide (or back past the first) carries on that way instead of rewinding: the
  // first slides are shown again after the last (or the last before the first), the track moves there, and once it
  // stops it's put back at the real index without a transition. virt is where the track stands meanwhile.
  const [wrap, setWrap] = React.useState<{ virt: number; edge: "after" | "before" } | null>(null);
  const [snap, setSnap] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const dragged = React.useRef(false);   // a drag just ended: the click that follows it doesn't count
  const prevBtn = React.useRef<HTMLButtonElement>(null), nextBtn = React.useRef<HTMLButtonElement>(null);
  const refocus = React.useRef<"prev" | "next" | "dot" | null>(null);

  const go = (i: number, ms: number | null = null) => {
    const next = loop ? ((i % (last + 1)) + last + 1) % (last + 1) : clamp(i);
    if (next === index) return;
    setSettle(ms);
    const moves = !!track.current && parseFloat(getComputedStyle(track.current).transitionDuration) > 0;
    // Only when the slides shown again are out of view, so none is in two places (count >= 2 per view).
    if (loop && moves && !wrap && count >= 2 * per) {
      if (i === last + 1 && index === last) setWrap({ virt: count, edge: "after" });
      else if (i === -1 && index === 0) setWrap({ virt: -per, edge: "before" });
    }
    if (!controlled) setOwn(next);
    if (props.onIndexChange) props.onIndexChange(next);
  };
  const rtl = () => !!viewport.current && getComputedStyle(viewport.current).direction === "rtl";
  // The direction as laid out (a dir attribute or CSS direction), so the track and chevrons can follow it.
  const [dir, setDir] = React.useState<"ltr" | "rtl">("ltr");
  // every render: an ancestor's dir or direction can change without a render of ours; reading it is a style lookup, not a layout.
  useIsoLayoutEffect(() => { const d = rtl() ? "rtl" : "ltr"; if (d !== dir) setDir(d); });

  const onDotsKey = (e: React.KeyboardEvent) => {
    const back = rtl() ? "ArrowRight" : "ArrowLeft", fwd = rtl() ? "ArrowLeft" : "ArrowRight";
    let to = -1;
    if (e.key === back) to = loop ? page - 1 : Math.max(0, page - 1);
    else if (e.key === fwd) to = loop ? page + 1 : Math.min(pages - 1, page + 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = pages - 1;
    else return;
    e.preventDefault();
    to = ((to % pages) + pages) % pages;
    refocus.current = "dot";   // focus the current dot once the index settles (a controlled parent may say no)
    go(pageStart(to));
  };
  const arrow = (step: 1 | -1) => {
    const to = index + step;
    if (!loop && (to <= 0 || to >= last)) refocus.current = step > 0 ? "prev" : "next";   // this button hides at the end: keep focus on the other
    go(to);
  };
  // every render: puts focus back after a key or button moved the slides, once the render has moved them.
  useIsoLayoutEffect(() => {
    const r = refocus.current;
    refocus.current = null;
    if (r === "dot") (dotsRef.current?.children[page] as HTMLElement | undefined)?.focus();
    else if (r && (document.activeElement === prevBtn.current || document.activeElement === nextBtn.current || document.activeElement === document.body)) (r === "prev" ? prevBtn : nextBtn).current?.focus();
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if (last < 1 || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, s: [{ t: e.timeStamp, p: e.clientX }] };
    dragged.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (offset === 0 && Math.abs(dx) < 8) return;
    if (offset === 0 && Math.abs(e.clientY - d.y) > Math.abs(dx)) { drag.current = null; return; }
    if (offset === 0 && viewport.current) try { viewport.current.setPointerCapture(e.pointerId); } catch { /* the pointer is already gone */ }
    dragged.current = true;
    sample(d.s, e.timeStamp, e.clientX);   // for the speed the finger had as it let go
    const forward = (dx < 0) !== rtl(), w = viewport.current ? viewport.current.clientWidth : 0;
    setOffset(!loop && (forward ? index >= last : index <= 0) ? rubber(dx, w) : dx);
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = e.clientX - d.x;
    const v = speed(d.s);   // px per ms, signed like dx
    const flick = Math.abs(dx) > 10 && Math.abs(v) > FLICK && Math.sign(v) === Math.sign(dx);
    const step = (viewport.current ? viewport.current.clientWidth : 0) / per;
    // Where the release is heading (KW11, fling.ts): a swipe let go of while pulling back to under 40px springs back.
    const to = dx + project(v);
    setOffset(0);
    if (flick || (Math.abs(dx) >= SWIPE && Math.sign(to) === Math.sign(dx) && Math.abs(to) >= SWIPE)) {
      // The slide nearest where it's heading: one at least, and a view at most, so a hard flick can't skip slides unseen.
      const n = Math.max(1, Math.min(Math.floor(per), Math.round(Math.abs(to) / Math.max(1, step))));
      // Carries on at the finger's speed (fling.ts), over the distance left to that slide.
      const ms = settleTime(Math.max(0, n * step - Math.abs(dx)), Math.sign(v) === Math.sign(dx) ? v : 0);
      setSettle(ms);   // also when there's no slide that way, and the rubber band goes back
      go(index + n * ((dx < 0) !== rtl() ? 1 : -1), ms);
    } else setSettle(offset ? settleTime(offset, 0) : null);   // back to where it was, briskly
  };
  // The track stopped after a loop carried on: put it at the real index at once, then let it move again.
  const onTrackEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform" || !wrap) return;
    setSnap(true); setWrap(null);
  };
  React.useEffect(() => {
    if (!snap) return;
    let f = requestAnimationFrame(() => { f = requestAnimationFrame(() => setSnap(false)); });   // two: one paints the snap
    return () => cancelAnimationFrame(f);
  }, [snap]);
  // The browser took the gesture (a scroll) or the pointer left before a drag began: put the slide back, change nothing.
  const onPointerCancel = (e: React.PointerEvent) => { if (drag.current && drag.current.id === e.pointerId) { drag.current = null; dragged.current = false; setOffset(0); } };
  const onPointerLeave = (e: React.PointerEvent) => { if (offset === 0) onPointerCancel(e); };

  const style = { ...props.style, "--dk-carousel-index": wrap ? wrap.virt : index, "--dk-carousel-count": count,
    ...(settle != null ? { "--dk-carousel-settle": settle + "ms", "--dk-carousel-ease": "var(--ease-fling)" } : null), "--dk-carousel-per": per, "--dk-carousel-drag": offset + "px" } as React.CSSProperties;
  const shown = (i: number) => i >= index && i < index + per;
  const prevOff = !loop && index === 0, nextOff = !loop && index >= last;

  return (
    <section {...rest} ref={(n) => { restyle(n); nameRef(n); }} className={cn("dk-carousel", per > 1 && "dk-carousel--multi", props.className)} style={style}
      aria-roledescription={sds.labels.carouselRole} aria-label={props.label ?? rest["aria-label"]} data-component="carousel" data-index={index} data-dir={dir}>
      <div className="dk-carousel__viewport" ref={viewport} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd} onPointerCancel={onPointerCancel} onPointerLeave={onPointerLeave}
        onDragStart={(e) => e.preventDefault()}   // a picture's own drag would end the swipe
        onClickCapture={(e) => { if (dragged.current && e.detail) { dragged.current = false; e.preventDefault(); e.stopPropagation(); } }}   // a swipe across a link isn't a click
        data-dragging={offset ? "" : undefined}>
        <div className="dk-carousel__track" aria-live="polite" ref={track} onTransitionEnd={onTrackEnd} data-snap={snap ? "" : undefined}>
          {slides.map((s, i) => (
            <div key={(s as React.ReactElement).key ?? i} className="dk-carousel__slide" role="group" aria-roledescription={sds.labels.slideRole} aria-label={name(i, count)}
              aria-hidden={shown(i) ? undefined : true} inert={!shown(i)} data-active={shown(i) ? "" : undefined}
              data-wrap={wrap && (wrap.edge === "after" ? i < per : i >= count - per) ? wrap.edge : undefined}>
              {s}
            </div>
          ))}
        </div>
        {props.arrows !== false && last > 0 ? <>
          <IconButton className="dk-carousel__arrow dk-carousel__arrow--prev" label={props.previousLabel || sds.labels.previousSlide} size="sm" variant="secondary" shape="round" noTitle
            icon={<><Icon icon={icons.ChevronLeft} className="dk-carousel__ltr" mirror={false} /><Icon icon={icons.ChevronRight} className="dk-carousel__rtl" mirror={false} /></>}
            ref={prevBtn} disabled={prevOff} onClick={() => arrow(-1)} />
          <IconButton className="dk-carousel__arrow dk-carousel__arrow--next" label={props.nextLabel || sds.labels.nextSlide} size="sm" variant="secondary" shape="round" noTitle
            icon={<><Icon icon={icons.ChevronRight} className="dk-carousel__ltr" mirror={false} /><Icon icon={icons.ChevronLeft} className="dk-carousel__rtl" mirror={false} /></>}
            ref={nextBtn} disabled={nextOff} onClick={() => arrow(1)} />
        </> : null}
      </div>
      {props.dots !== false && last > 0 ? (
        <div className="dk-carousel__dots" ref={dotsRef} onKeyDown={onDotsKey}>
          {Array.from({ length: pages }, (_, k) => (
            <button key={k} type="button" className="dk-carousel__dot" aria-label={dotName(k)} aria-current={k === page ? "true" : undefined}
              tabIndex={k === page ? 0 : -1} onClick={() => go(pageStart(k))} />
          ))}
        </div>
      ) : null}
    </section>
  );
});
