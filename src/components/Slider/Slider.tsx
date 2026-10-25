"use client";
import * as React from "react";
import { cn, isInvalid, omit } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { component } from "../../internal/component";
import { useFormReset } from "../../internal/useFormReset";
import { useFieldsetDisabled } from "../../internal/useFieldsetDisabled";
import { snap as snapToGrid } from "../../internal/step";
import { useFieldLabel } from "../../internal/fieldLabel";
import { delegateFocus, useAutoFocus } from "../../internal/focus";
import { useSerupa } from "../../internal/provider";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";

export type SliderValue = number | [number, number];
/** A mark on a Slider's track: a value, and optional text shown under it. */
export interface SliderMark { value: number; label?: React.ReactNode }
/** V is a number for one thumb or [low, high] for a range, inferred from value, defaultValue or the callbacks. */
export interface SliderProps<V extends SliderValue = SliderValue> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  /** The value (controlled): a number, or [low, high] for a range with two thumbs. Use with onValueChange. */
  value?: V;
  /** The value at first (uncontrolled). Default: min. */
  defaultValue?: V;
  /** Called with the new value as it moves (dragging, keys). */
  onValueChange?: (value: V) => void;
  /** Called once when a drag or key press ends: for saving or fetching. */
  onValueCommit?: (value: V) => void;
  /** Default: 0. */
  min?: number;
  /** Default: 100. */
  max?: number;
  /** The smallest change. Default: 1. */
  step?: number;
  /** How many steps PageUp, PageDown and Shift with an arrow move. Default: 10. */
  largeStep?: number;
  /** 'sm' (4px track, 16px thumb) or 'md' (6px, 20px, default). */
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Turns a value into the words read out (aria-valuetext), such as "$40". Default: the number. */
  formatValue?: (value: number) => string;
  /** A range's thumb names. Default: the sliderMinimum and sliderMaximum labels ("Minimum", "Maximum"). A single thumb is named by aria-label or aria-labelledby. */
  thumbLabels?: [string, string];
  /** Submits the value with a form: one hidden input, or two with the same name for a range. */
  name?: string;
  /** The id of a form to submit and reset with, when it isn't inside one, as the form attribute of an input. */
  form?: string;
  /** A danger fill and thumb ring, and aria-invalid on the thumbs. Say what's wrong in text next to it (Field's error does). */
  invalid?: boolean;
  /** Focusable and read out, but keys and presses don't change it; the value is still submitted. */
  readOnly?: boolean;
  /** Accepted so Field's required doesn't reach the DOM. A slider always has a value, so it has no effect. */
  required?: boolean;
  /** Ticks on the track: true for every step (every largeStep steps past 100 ticks), or a list of values with optional text under each. Visual only; the thumb's value is what's read out. */
  marks?: boolean | SliderMark[];
  /** Shows the value (formatValue's text) over a thumb while it's focused, dragged or hovered. Visual only, as aria-valuetext already says it. */
  showValue?: boolean;
}

const OWN = { value: 1, defaultValue: 1, onValueChange: 1, onValueCommit: 1, min: 1, max: 1, step: 1, largeStep: 1, size: 1, disabled: 1, formatValue: 1, thumbLabels: 1, name: 1, form: 1, invalid: 1, readOnly: 1, required: 1, marks: 1, showValue: 1, "aria-required": 1, "aria-invalid": 1, "aria-readonly": 1, autoFocus: 1, className: 1, "aria-label": 1, "aria-labelledby": 1, "aria-describedby": 1 } as const;

// The marks to draw: every step for true (every largeStep steps when that's over 100 ticks), or the listed values on the track.
function markList(marks: SliderProps["marks"], min: number, max: number, step: number, large: number): SliderMark[] {
  if (Array.isArray(marks)) return marks.filter((m) => m && isFinite(m.value) && m.value >= min && m.value <= max);
  if (marks !== true) return [];
  const every = (max - min) / step > 100 ? step * large : step, out: SliderMark[] = [];
  for (let i = 0, v = min; v <= max + every / 1e9 && i <= 1000; i++, v = min + i * every) out.push({ value: snapToGrid(v, min, max, step) });
  return out;
}

/* Slider: picks a number, or a range with two thumbs, by dragging along a track or with the keyboard. Each thumb
   is role="slider" with aria-valuenow, min, max and valuetext. Arrows change it by step (Right and Up raise it;
   Left and Right swap in right-to-left pages), PageUp, PageDown and Shift+arrows by largeStep steps, Home and End
   go to the ends. A press anywhere on the track moves the nearest thumb there; range thumbs can't cross.
   onValueChange fires as it moves, onValueCommit once when a drag or key press ends. */
/** Picks a number, or a range with two thumbs, on a track. */
export const Slider = /* @__PURE__ */ component<HTMLDivElement, SliderProps>("Slider", function Slider(props, ref) {
  const nameRef = useNameCheck("Slider", NAME_HOW.field);   // warns when it has no accessible name
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const sds = useSerupa();
  const min = isFinite(Number(props.min)) && props.min != null ? Number(props.min) : 0;
  const maxIn = isFinite(Number(props.max)) && props.max != null ? Number(props.max) : 100;
  const max = maxIn > min ? maxIn : min + 1;
  const step = Number(props.step) > 0 ? Number(props.step) : 1;
  const large = Number(props.largeStep) > 0 ? Number(props.largeStep) : 10;
  const snap = (v: number) => snapToGrid(v, min, max, step);
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState<SliderValue>(props.defaultValue ?? min);
  const raw = controlled ? (props.value as SliderValue) : own;
  const isRange = Array.isArray(raw);
  const vals: number[] = isRange ? [snap((raw as number[])[0]), snap((raw as number[])[1])].sort((a, b) => a - b) : [snap(raw)];
  const latest = React.useRef(vals); latest.current = vals;
  const root = React.useRef<HTMLDivElement | null>(null);
  useFormReset(root, () => { if (!controlled) setOwn(props.defaultValue ?? min); }, props.form);
  const thumbs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const drag = React.useRef<number | null>(null);
  // A disabled <fieldset> around it disables it too, as it does native inputs.
  const inDisabledFieldset = useFieldsetDisabled(root);
  const disabled = !!props.disabled || inDisabledFieldset;
  const invalid = isInvalid(props.invalid, props["aria-invalid"]);
  const readOnly = !!props.readOnly || props["aria-readonly"] === true || props["aria-readonly"] === "true";
  const still = disabled || readOnly;   // nothing moves the value
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const out = (vs: number[]): SliderValue => (isRange ? [vs[0], vs[1]] : vs[0]);
  const text = (v: number) => (props.formatValue ? props.formatValue(v) : String(v));
  // ref.current.focus() and autoFocus land on the first thumb, as they would on an <input type="range">.
  const live = React.useRef(disabled); live.current = disabled;
  const first = () => (live.current ? null : thumbs.current[0]);
  useAutoFocus(props.autoFocus, first);

  const set = (i: number, v: number) => {
    const vs = latest.current.slice();
    let n = snap(v);
    if (isRange) n = i === 0 ? Math.min(n, vs[1]) : Math.max(n, vs[0]);
    if (n === vs[i]) return vs;
    vs[i] = n;
    latest.current = vs;
    if (!controlled) setOwn(out(vs));
    if (props.onValueChange) props.onValueChange(out(vs));
    return vs;
  };
  const commit = () => { if (props.onValueCommit) props.onValueCommit(out(latest.current)); };
  const fromPoint = (x: number) => {
    const r = root.current!.querySelector(".dk-slider__track")!.getBoundingClientRect();
    let share = r.width ? (x - r.left) / r.width : 0;
    if (getComputedStyle(root.current!).direction === "rtl") share = 1 - share;
    return min + Math.min(1, Math.max(0, share)) * (max - min);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rest.onPointerDown) rest.onPointerDown(e);
    if (disabled || e.button !== 0 || e.defaultPrevented) return;
    e.preventDefault();
    const v = fromPoint(e.clientX), vs = latest.current;
    let i = 0;
    if (isRange) { const d0 = Math.abs(v - vs[0]), d1 = Math.abs(v - vs[1]); i = d1 < d0 || (d1 === d0 && v > vs[1]) ? 1 : 0; }
    // Read-only: a press focuses the nearest thumb, as it would a read-only input, and moves nothing.
    if (readOnly) { thumbs.current[i]?.focus({ preventScroll: true }); return; }
    drag.current = i;
    e.currentTarget.setPointerCapture(e.pointerId);
    set(i, v);
    const t = thumbs.current[i]; if (t) t.focus({ preventScroll: true });
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => { if (rest.onPointerMove) rest.onPointerMove(e); if (drag.current != null) set(drag.current, fromPoint(e.clientX)); };
  const end = (e: React.PointerEvent<HTMLDivElement>) => { if (drag.current == null) return; drag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); commit(); };
  // Your onKeyDown runs first, so preventDefault() in it keeps the slider's own handling of that key from running.
  const onKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(e as unknown as React.KeyboardEvent<HTMLDivElement>);
    if (still || e.defaultPrevented) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const by = (e.shiftKey ? large : 1) * step, v = latest.current[i];
    let n: number;
    switch (e.key) {
      case "ArrowUp": n = v + by; break;
      case "ArrowDown": n = v - by; break;
      case "ArrowRight": n = rtl ? v - by : v + by; break;
      case "ArrowLeft": n = rtl ? v + by : v - by; break;
      case "PageUp": n = v + large * step; break;
      case "PageDown": n = v - large * step; break;
      case "Home": n = isRange && i === 1 ? latest.current[0] : min; break;
      case "End": n = isRange && i === 0 ? latest.current[1] : max; break;
      default: return;
    }
    e.preventDefault();
    const before = latest.current[i];
    if (set(i, n)[i] !== before) commit();
  };

  // onFocus and onBlur fire when focus enters or leaves the slider, not when it moves between a range's two thumbs.
  const crossing = (e: React.FocusEvent<HTMLDivElement>) => !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget));
  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => { if (rest.onFocus && crossing(e)) rest.onFocus(e); };
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => { if (rest.onBlur && crossing(e)) rest.onBlur(e); };

  const names = props.thumbLabels || [sds.labels.sliderMinimum, sds.labels.sliderMaximum];
  // In a Field, its label names the slider (or a range's group) and its hint and error describe the thumb (or the group).
  const fieldLabel = useFieldLabel(props.id);
  const labelledBy = props["aria-labelledby"] ?? (props["aria-label"] ? undefined : fieldLabel);
  const lo = isRange ? pct(vals[0]) : 0, hi = pct(vals[vals.length - 1]);
  const marks = markList(props.marks, min, max, step, large);
  const labelled = marks.some((m) => m.label != null && m.label !== false && m.label !== "");
  return (
    <div {...rest} ref={(n) => { root.current = n; delegateFocus(n, first); restyle(n); }}
      role={isRange ? "group" : rest.role} aria-label={isRange ? props["aria-label"] : undefined} aria-labelledby={isRange ? labelledBy : undefined}
      aria-describedby={isRange ? props["aria-describedby"] : undefined}
      className={cn("dk-slider", props.size === "sm" ? "dk-slider--size-sm" : "dk-slider--size-md", disabled && "dk-slider--disabled", readOnly && "dk-slider--readonly", invalid && "dk-slider--invalid", labelled && "dk-slider--mark-labels", props.className)}
      data-component="slider" data-size={props.size === "sm" ? "sm" : "md"} data-disabled={disabled ? "" : undefined} data-readonly={readOnly ? "" : undefined} data-invalid={invalid ? "" : undefined}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end}
      onKeyDown={undefined} onFocus={onFocus} onBlur={onBlur}>
      <div className="dk-slider__track">
        <div className="dk-slider__fill" style={{ insetInlineStart: lo + "%", inlineSize: hi - lo + "%" }} />
        {marks.map((m, i) => (
          <span key={i} className="dk-slider__mark" style={{ insetInlineStart: pct(m.value) + "%" }} aria-hidden="true">
            {m.value > min && m.value < max ? <span className="dk-slider__tick" /> : null}
            {m.label != null && m.label !== false ? <span className="dk-slider__mark-label">{m.label}</span> : null}
          </span>
        ))}
        {vals.map((v, i) => (
          <span key={i} ref={(n) => { thumbs.current[i] = n; if (!isRange) nameRef(n); }} className="dk-slider__thumb" style={{ insetInlineStart: pct(v) + "%" }}
            role="slider" tabIndex={disabled ? -1 : 0} aria-valuenow={v} aria-valuemin={isRange && i === 1 ? vals[0] : min} aria-valuemax={isRange && i === 0 ? vals[1] : max}
            aria-valuetext={props.formatValue ? text(v) : undefined} aria-orientation="horizontal" aria-disabled={disabled || undefined} aria-readonly={readOnly || undefined} aria-invalid={invalid || undefined}
            aria-label={isRange ? names[i] : props["aria-label"]} aria-labelledby={isRange ? undefined : labelledBy}
            aria-describedby={isRange ? undefined : props["aria-describedby"]}
            onKeyDown={onKeyDown(i)}>{props.showValue ? <span className="dk-slider__value" aria-hidden="true"><span>{text(v)}</span></span> : null}</span>
        ))}
      </div>
      {props.name ? vals.map((v, i) => <input key={"in" + i} type="hidden" name={props.name} form={props.form} value={v} disabled={disabled} />) : null}
    </div>
  );
}) as (<V extends SliderValue = SliderValue>(props: SliderProps<V> & React.RefAttributes<HTMLDivElement>) => React.ReactElement | null) & { displayName?: string };
