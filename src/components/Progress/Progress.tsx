"use client";
import * as React from "react";
import { cn, domId, oneOf, omit, SIZES } from "../../internal/cn";
import { component } from "../../internal/component";
import { displayNumber } from "../../internal/numbers";
import { useLocale, useSerupa } from "../../internal/provider";
import { announce, ensureAnnouncer } from "../../internal/announce";

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';
export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** How far along, from 0 to max. Leave it out (or null) when you can't tell: the bar then shows an animated segment. */
  value?: number | null;
  /** The value that means done. Default: 100. */
  max?: number;
  /** 'bar' (default): a horizontal bar, full width. 'circle': a ring. */
  variant?: 'bar' | 'circle';
  /** The bar's thickness: 'sm' 4px, 'md' 8px (default), 'lg' 12px. The ring: 24, 40 or 64px. */
  size?: 'sm' | 'md' | 'lg';
  /** The fill color: 'primary' (default), 'success', 'warning' or 'danger'. */
  tone?: ProgressTone;
  /** A visible name above the bar (bar only), which also names it. Without one, give it an aria-label. */
  label?: React.ReactNode;
  /** Shows the value: at the end of the label row, or inside the ring (md and lg). Default: false. */
  showValue?: boolean;
  /** Turns the value into words, shown and read out. Default: the percentage as the locale writes it: "45%", "%45" in
      Turkish, "45 %" in French, "٤٥٪" in Egyptian Arabic. */
  formatValue?: (value: number, max: number) => string;
  /** Says politely that it's done when the value reaches max: true says "Upload: complete" (the label or aria-label,
      then labels.progressComplete), or pass your own words. The bar's value changes aren't read out on their own. */
  announceComplete?: boolean | string;
  /** Called once each time the value reaches max (not when it starts there). */
  onComplete?: () => void;
}

const TONES: readonly ProgressTone[] = ["primary", "success", "warning", "danger"];
const OWN = { value: 1, max: 1, variant: 1, size: 1, tone: 1, label: 1, showValue: 1, formatValue: 1, announceComplete: 1, onComplete: 1, className: 1 } as const;
const PERCENT = { style: "percent", maximumFractionDigits: 0 } as const;

/* Progress: how far along a task is, when you can tell: an upload, a setup, a quota. variant "bar" (default) or
   "circle"; size sm, md, lg; tone primary (default), success, warning or danger; an optional label above the
   bar and the value (45%, in the locale's digits and signs) beside it or inside the ring. Without a value it's
   indeterminate: an animated segment (or turning arc) for when you can't tell; Loader is the lighter choice for
   that. Renders role="progressbar" with aria-valuenow / min / max and aria-valuetext. */
/** How far along a task is: a bar or a ring with role="progressbar"; leave value out when you can't tell. */
export const Progress = /* @__PURE__ */ component<HTMLDivElement, ProgressProps>("Progress", function Progress(props, ref) {
  const rest = omit(props, OWN);
  const locale = useLocale();
  const base = domId("dk-prg", React.useId());
  const variant = props.variant === "circle" ? "circle" : "bar";
  const size = oneOf(SIZES, props.size, "md");
  const tone = oneOf(TONES, props.tone, "primary");
  const max = Number(props.max) > 0 ? Number(props.max) : 100;
  const known = props.value != null && isFinite(Number(props.value));
  const value = known ? Math.min(max, Math.max(0, Number(props.value))) : 0;
  const text = known ? (props.formatValue ? props.formatValue(value, max) : displayNumber(value / max, locale, PERCENT)) : "";
  const hasLabel = props.label != null && props.label !== false && props.label !== "";
  const showValue = !!props.showValue && known;
  const share = known ? value / max : 0;
  // Reaching max is said once, and onComplete called, when the value gets there (not when it renders there).
  const sds = useSerupa();
  const done = known && value >= max;
  const was = React.useRef(done);
  const name = typeof props.label === "string" ? props.label : typeof rest["aria-label"] === "string" ? rest["aria-label"] : "";
  const words = props.announceComplete ? (typeof props.announceComplete === "string" ? props.announceComplete : sds.labels.progressComplete(name)) : "";
  const finish = React.useRef({ words, onComplete: props.onComplete }); finish.current = { words, onComplete: props.onComplete };
  const speaks = !!props.announceComplete;
  React.useEffect(() => { if (speaks) ensureAnnouncer(); }, [speaks]);
  React.useEffect(() => {
    if (done && !was.current) {
      if (finish.current.words) announce(finish.current.words);
      if (finish.current.onComplete) finish.current.onComplete();
    }
    was.current = done;
  }, [done]);
  const aria: React.AriaAttributes & { role?: React.AriaRole } = { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": max };
  if (known) { aria["aria-valuenow"] = value; aria["aria-valuetext"] = text; }
  if (hasLabel && variant === "bar" && !rest["aria-label"] && !rest["aria-labelledby"]) aria["aria-labelledby"] = base + "-label";
  const cls = cn("dk-progress", "dk-progress--" + variant, "dk-progress--size-" + size, tone !== "primary" && "dk-progress--" + tone, !known && "dk-progress--indeterminate", props.className);
  const data = { "data-component": "progress", "data-variant": variant, "data-size": size, "data-tone": tone, "data-state": known ? (value >= max ? "complete" : "loading") : "indeterminate" };

  if (variant === "circle") {
    return (
      <div {...rest} {...aria} {...data} ref={ref} className={cls}>
        <svg className="dk-progress__ring" viewBox="0 0 24 24" aria-hidden focusable="false">
          <circle className="dk-progress__track" cx={12} cy={12} r={10.5} />
          <circle className="dk-progress__arc" cx={12} cy={12} r={10.5} pathLength={100} strokeDasharray={known ? share * 100 + " 100" : "25 100"} />
        </svg>
        {showValue && size !== "sm" ? <span className="dk-progress__value" aria-hidden>{text}</span> : null}
      </div>
    );
  }
  const outer = omit(rest, { "aria-label": 1, "aria-labelledby": 1 } as const);
  return (
    <div {...outer} {...data} ref={ref} className={cls}>
      {hasLabel || showValue ? (
        <div className="dk-progress__header">
          {hasLabel ? <span className="dk-progress__label" id={base + "-label"}>{props.label}</span> : null}
          {showValue ? <span className="dk-progress__value" aria-hidden>{text}</span> : null}
        </div>
      ) : null}
      <div {...aria} className="dk-progress__track" aria-label={rest["aria-label"]} aria-labelledby={rest["aria-labelledby"] || aria["aria-labelledby"]}>
        <div className="dk-progress__fill" style={known ? { inlineSize: share * 100 + "%" } : undefined} />
      </div>
    </div>
  );
});
