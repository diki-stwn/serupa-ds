"use client";
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import { component } from "../../internal/component";
import { displayNumber } from "../../internal/numbers";
import { useLocale, useSettings } from "../../internal/provider";
import * as icons from "../../material/builtin";
import { en as words } from "./labels";

export interface StepperStep {
  title: React.ReactNode;
  /** A muted line under the title. */
  description?: React.ReactNode;
  /** Shows "Optional" under the title. */
  optional?: boolean;
  /** 'error': marks the step in danger, such as a step with a problem to fix. 'warning': amber, for a softer
      problem that doesn't block going on, such as a field left for later. */
  status?: 'error' | 'warning';
}
export interface StepperProps extends React.HTMLAttributes<HTMLElement> {
  /** The steps, in order. */
  steps: StepperStep[];
  /** The current step's index, from 0. Steps before it are complete; steps.length marks them all complete. */
  current: number;
  /** 'horizontal' (default): side by side, joined by lines. 'vertical': stacked, for narrow spaces or long descriptions. */
  orientation?: 'horizontal' | 'vertical';
  /** 'sm' (24px circles, text-xs) or 'md' (32px, text-sm, default). */
  size?: 'sm' | 'md';
  /** Makes steps buttons that go to them: the completed ones, or every one but the current with clickable="all". */
  onStepClick?: (index: number) => void;
  /** Which steps onStepClick makes buttons. 'completed' (default): the ones before the current step. 'all': every
      step but the current one, for a form people can fill in any order. */
  clickable?: 'completed' | 'all';
  /** Words read out or shown: { completed: 'completed', error: 'has an error', warning: 'needs attention', optional: 'Optional', stepOf: (step, total) => `Step ${step} of ${total}` }. */
  labels?: { completed?: string; error?: string; warning?: string; optional?: string; stepOf?: (step: number, total: number) => string };
}

const OWN = { steps: 1, current: 1, orientation: 1, size: 1, onStepClick: 1, clickable: 1, labels: 1, className: 1 } as const;

/* Stepper: where people are in a task split into steps (sign-up, checkout, setup). Each step has a numbered
   circle, a title and an optional description; completed steps show a check and fill in primary, the current
   one is filled and ringed, a step with status "error" turns danger and one with "warning" amber. Horizontal (default), joined by lines, or
   vertical. A <nav> around an <ol>; the current step has aria-current="step", and completed or error steps say
   so to screen readers. With onStepClick, completed steps are buttons that go back to them (every step but the
   current one with clickable="all"). When a horizontal
   Stepper is too narrow for its titles side by side (a phone, 400% zoom), it keeps the circles and shows one line
   under them, "Step 2 of 4: Profile"; the titles stay in the list for screen readers. */
/** Where people are in a task split into steps: numbered circles joined by lines. */
export const Stepper = /* @__PURE__ */ component<HTMLElement, StepperProps>("Stepper", function Stepper(props, ref) {
  const sds = useSettings(words);
  const locale = useLocale();
  const rest = omit(props, OWN);
  const steps = props.steps || [];
  const current = Math.max(0, Math.min(steps.length, Math.floor(Number(props.current)) || 0));
  const vertical = props.orientation === "vertical";
  const size = props.size === "sm" ? "sm" : "md";
  const L = { completed: sds.labels.completed, error: sds.labels.hasError, warning: sds.labels.hasWarning, optional: sds.labels.optional, stepOf: sds.labels.stepOf, ...(props.labels || {}) };
  const nav = React.useRef<HTMLElement | null>(null);
  const [compact, setCompact] = React.useState(false);
  const [tight, setTight] = React.useState(false);
  // What the measure depends on: the steps' text when it is plain text, so an inline steps array (a new array each
  // render) doesn't measure again; titles that are elements are compared by the array itself.
  const text = (n: React.ReactNode) => (n == null || typeof n === "string" || typeof n === "number" || typeof n === "boolean" ? String(n) : null);
  const parts = steps.map((s) => [text(s.title), text(s.description), String(!!s.optional), s.status || ""]);
  const shape = parts.every((p) => p[0] != null && p[1] != null) ? parts.map((p) => p.join("\u0001")).join("\u0000") : steps;
  // Measure the titles side by side (at their full width, with the shortest lines) against the width there is.
  useIsoLayoutEffect(() => {
    const el = nav.current;
    if (!el || vertical) { setCompact(false); return; }
    // GR62: from here the script fits the row (compact when the titles don't fit), so the no-script layout below in
    // Stepper.css, which wraps the steps, gives way.
    el.setAttribute("data-fit", "");
    const fit = () => {
      const list = el.firstElementChild as HTMLElement, has = (c: string) => el.classList.contains(c);
      el.classList.add("dk-stepper--measure");
      const need = list.scrollWidth;
      el.classList.remove("dk-stepper--measure");
      const narrow = need > el.clientWidth;
      // Circles only and still too wide (many steps): the sm circles (GN2). Lay the row out compact with md circles
      // for a moment to tell.
      let small = false;
      if (narrow && size === "md") {
        const was = [has("dk-stepper--compact"), has("dk-stepper--tight")];
        el.classList.add("dk-stepper--compact"); el.classList.remove("dk-stepper--tight");
        small = list.scrollWidth > el.clientWidth;
        el.classList.toggle("dk-stepper--compact", was[0]); el.classList.toggle("dk-stepper--tight", was[1]);
      }
      setCompact(narrow); setTight(small);
    };
    fit();
    // Again when web fonts load: titles drawn first in a fallback font change width when the real one arrives
    // (font-display: swap), and the nav's own width doesn't, so the ResizeObserver doesn't fire (GR65).
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    let live = true;
    if (fonts) {
      if (fonts.status !== "loaded") fonts.ready.then(() => { if (live) fit(); }, () => {});
      fonts.addEventListener("loadingdone", fit);
    }
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    if (ro) ro.observe(el);
    return () => { live = false; if (fonts) fonts.removeEventListener("loadingdone", fit); if (ro) ro.disconnect(); };
  }, [vertical, shape, size]);
  // Going to a step makes its button the current step's plain head, so React replaces the element that has focus
  // and focus would drop to the page: put it on the new current head instead (GN1).
  const going = React.useRef<number | null>(null);
  useIsoLayoutEffect(() => {
    const el = nav.current, to = going.current;
    going.current = null;
    if (!el || to !== current) return;
    const active = document.activeElement;
    if (active && active !== document.body && el.contains(active)) return;
    const head = el.querySelectorAll<HTMLElement>(".dk-stepper__head")[current];
    if (head) head.focus();
  }, [current]);
  const shown = Math.min(current, steps.length - 1);
  return (
    <nav {...rest} ref={(node) => { nav.current = node; setRef(ref, node); }} aria-label={rest["aria-label"] || (rest["aria-labelledby"] ? undefined : sds.labels.progress)}
      className={cn("dk-stepper", vertical ? "dk-stepper--vertical" : "dk-stepper--horizontal", compact && "dk-stepper--compact", compact && tight && "dk-stepper--tight", "dk-stepper--size-" + size, props.className)}
      data-component="stepper" data-orientation={vertical ? "vertical" : "horizontal"} data-size={size}>
      <ol className="dk-stepper__list">
        {steps.map((s, i) => {
          const state = s.status === "error" || s.status === "warning" ? s.status : i < current ? "complete" : i === current ? "current" : "upcoming";
          const clickable = !!props.onStepClick && (props.clickable === "all" ? i !== current : i < current);
          const Head: React.ElementType = clickable ? "button" : "div";
          const hasDesc = s.description != null && s.description !== "";
          return (
            <li key={i} className={cn("dk-stepper__step", "dk-stepper__step--" + state, i < current && "dk-stepper__step--done")} data-state={state} aria-current={i === current ? "step" : undefined}>
              <Head className="dk-stepper__head" {...(clickable ? { type: "button", onClick: () => { going.current = i; props.onStepClick!(i); } } : props.onStepClick && i === current ? { tabIndex: -1 } : {})}>
                <span className="dk-stepper__indicator" aria-hidden>
                  {state === "complete" ? <Icon icon={icons.Check} /> : state === "error" ? <Icon icon={icons.PriorityHigh} /> : state === "warning" ? <Icon icon={icons.Warning} /> : displayNumber(i + 1, locale)}
                </span>
                <span className="dk-stepper__text">
                  <span className="dk-stepper__title">
                    {s.title}
                    {state === "complete" ? <VisuallyHidden>{", " + L.completed}</VisuallyHidden> : state === "error" ? <VisuallyHidden>{", " + L.error}</VisuallyHidden> : state === "warning" ? <VisuallyHidden>{", " + L.warning}</VisuallyHidden> : null}
                  </span>
                  {hasDesc ? <span className="dk-stepper__description">{s.description}</span> : null}
                  {s.optional ? <span className="dk-stepper__description dk-stepper__optional">{L.optional}</span> : null}
                </span>
              </Head>
              {i < steps.length - 1 ? <span className="dk-stepper__connector" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
      {compact && shown >= 0 ? <p className="dk-stepper__summary" aria-hidden>{L.stepOf(shown + 1, steps.length) + ": "}<span className="dk-stepper__title">{steps[shown].title}</span></p> : null}
    </nav>
  );
});
