"use client";
import * as React from "react";
import { cn, domId, oneOf, omit, SIZES } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { component } from "../../internal/component";
import { displayNumber } from "../../internal/numbers";
import { useLocale, useSerupa } from "../../internal/provider";
import type { MeterZone } from "./labels";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";

export type MeterState = 'optimum' | 'suboptimal' | 'poor' | 'none';
export interface MeterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The measured value, between min and max. */
  value: number;
  /** The lowest possible value. Default: 0. */
  min?: number;
  /** The highest possible value. Default: 100. */
  max?: number;
  /** Values under this are low. With high, it sets the zones that color the bar. */
  low?: number;
  /** Values over this are high. */
  high?: number;
  /** The best value. Under low: low values are good (a fill rate). Over high: high values are good (a battery). In
      between, or left out: the middle zone is good and both ends are less good (a temperature). */
  optimum?: number;
  /** The bar's thickness: 'sm' 4px, 'md' 8px (default), 'lg' 12px. */
  size?: 'sm' | 'md' | 'lg';
  /** A visible name above the bar, which also names it. Without one, give it an aria-label. */
  label?: React.ReactNode;
  /** Shows the value at the end of the label row. Default: false. */
  showValue?: boolean;
  /** Turns the value into words, shown and read out: (value, min, max) => "7.2 of 10 GB". Default: the share as the
      locale writes a percentage ("72%"). Say what a colored zone means here too, such as "92%, almost full". */
  formatValue?: (value: number, min: number, max: number) => string;
}

const OWN = { value: 1, min: 1, max: 1, low: 1, high: 1, optimum: 1, size: 1, label: 1, showValue: 1, formatValue: 1, className: 1 } as const;
const PERCENT = { style: "percent", maximumFractionDigits: 0 } as const;
const num = (v: unknown) => (v != null && isFinite(Number(v)) ? Number(v) : undefined);

/** Which zone value is in, as HTML's <meter> works it out: optimum (success), suboptimal (warning) or poor (danger);
    'none' when there's no low or high, so no zones. */
export function meterState(value: number, min: number, max: number, low?: number, high?: number, optimum?: number): MeterState {
  if (low == null && high == null) return "none";
  const lo = Math.min(Math.max(low ?? min, min), max), hi = Math.min(Math.max(high ?? max, lo), max);
  const best = Math.min(Math.max(optimum ?? (min + max) / 2, min), max);
  if (best < lo) return value < lo ? "optimum" : value <= hi ? "suboptimal" : "poor";
  if (best > hi) return value > hi ? "optimum" : value >= lo ? "suboptimal" : "poor";
  return value >= lo && value <= hi ? "optimum" : "suboptimal";
}

/** Where value falls against low and high (clamped the way meterState clamps them). */
function zone(value: number, min: number, max: number, low?: number, high?: number): MeterZone {
  const lo = Math.min(Math.max(low ?? min, min), max), hi = Math.min(Math.max(high ?? max, lo), max);
  return value < lo ? "low" : value > hi ? "high" : "medium";
}

const TONE: Record<MeterState, string | null> = { optimum: "success", suboptimal: "warning", poor: "danger", none: null };

/* Meter: a measurement within a known range, such as storage used, a password's strength or a battery level. It's
   not Progress, which is how far along a task is. low, high and optimum set zones, as HTML's <meter> does: the
   bar is success in the best zone, warning in the next and danger in the worst; without low and high it's
   primary. size sm, md (default) or lg; an optional label above the bar, and the value beside it. Renders
   role="meter" with aria-valuenow / min / max and aria-valuetext, and data-state with the zone. */
/** A measurement within a known range (storage used, strength, a level): a bar with role="meter", colored by the low, high and optimum zones. */
export const Meter = /* @__PURE__ */ component<HTMLDivElement, MeterProps>("Meter", function Meter(props, ref) {
  const nameRef = useNameCheck("Meter", NAME_HOW.label);   // warns when it has no accessible name
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const locale = useLocale();
  const base = domId("dk-mtr", React.useId());
  const size = oneOf(SIZES, props.size, "md");
  const min = num(props.min) ?? 0;
  const max = Math.max(num(props.max) ?? 100, min);
  const value = Math.min(max, Math.max(min, num(props.value) ?? min));
  const share = max > min ? (value - min) / (max - min) : 0;
  const state = meterState(value, min, max, num(props.low), num(props.high), num(props.optimum));
  const tone = TONE[state];
  const labels = useSerupa().labels;
  const text = props.formatValue ? props.formatValue(value, min, max) : displayNumber(share, locale, PERCENT);
  // Outside the best zone, the default words say where the value falls, so the warning isn't only a color.
  const spoken = props.formatValue || state === "none" || state === "optimum" ? text : labels.meterZone(text, zone(value, min, max, num(props.low), num(props.high)));
  const hasLabel = props.label != null && props.label !== false && props.label !== "";
  const showValue = !!props.showValue;
  const outer = omit(rest, { "aria-label": 1, "aria-labelledby": 1 } as const);
  return (
    <div {...outer} ref={restyle} className={cn("dk-meter", "dk-meter--size-" + size, tone && "dk-meter--" + tone, props.className)}
      data-component="meter" data-size={size} data-state={state}>
      {hasLabel || showValue ? (
        <div className="dk-meter__header">
          {hasLabel ? <span className="dk-meter__label" id={base + "-label"}>{props.label}</span> : null}
          {showValue ? <span className="dk-meter__value" aria-hidden>{text}</span> : null}
        </div>
      ) : null}
      <div ref={nameRef} className="dk-meter__track" role="meter" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={spoken}
        aria-label={rest["aria-label"]} aria-labelledby={rest["aria-labelledby"] || (hasLabel && !rest["aria-label"] ? base + "-label" : undefined)}>
        <div className="dk-meter__fill" style={{ "--dk-meter-rest": +((1 - share) * 100).toFixed(4) + "%" } as React.CSSProperties} />
      </div>
    </div>
  );
});
