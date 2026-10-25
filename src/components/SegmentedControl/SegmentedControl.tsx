"use client";
import * as React from "react";
import { cn, isInvalid, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { useFormReset } from "../../internal/useFormReset";
import { useFieldLabel } from "../../internal/fieldLabel";
import { delegateFocus, useAutoFocus } from "../../internal/focus";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";

export interface SegmentedControlOption {
  value: string;
  /** The segment's text. With only an icon, pass aria-label instead. */
  label?: React.ReactNode;
  /** An icon name or element before the label. */
  icon?: IconSource;
  /** The segment's name when it shows only an icon. */
  "aria-label"?: string;
  disabled?: boolean;
}
export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The segments, in order: 2 to about 5. */
  options: SegmentedControlOption[];
  /** The selected value (controlled). Use with onValueChange. */
  value?: string;
  /** The value selected at first (uncontrolled). Default: the first segment that isn't disabled. */
  defaultValue?: string;
  /** Called with the new value when a segment is chosen. */
  onValueChange?: (value: string) => void;
  /** 'sm' (24px), 'md' (32px, default) or 'lg' (44px): the control heights. */
  size?: 'sm' | 'md' | 'lg';
  /** Stretches to its container, with equal segments. Default: false. */
  fullWidth?: boolean;
  disabled?: boolean;
  /** Submits the value with a form, in a hidden input. */
  name?: string;
  /** The id of a form to submit and reset with, when it isn't inside one, as the form attribute of an input. */
  form?: string;
  /** A danger outline, and aria-invalid on the group. Say what's wrong in text next to it (Field's error does). */
  invalid?: boolean;
  /** Sets aria-required on the group. */
  required?: boolean;
  /** Focusable and read out, and arrows move focus, but nothing changes the selection; the value is still submitted. */
  readOnly?: boolean;
}

const OWN = { options: 1, value: 1, defaultValue: 1, onValueChange: 1, size: 1, fullWidth: 1, disabled: 1, name: 1, form: 1, invalid: 1, required: 1, readOnly: 1, "aria-invalid": 1, "aria-required": 1, "aria-readonly": 1, autoFocus: 1, className: 1 } as const;

/* SegmentedControl: picks one of a few options shown side by side, such as a view (List, Board) or a period
   (Day, Week, Month). It's a radio group: one Tab stop, arrow keys move and select (Home and End too), and
   each segment is role="radio" with aria-checked. The selection is a raised surface that slides to the chosen
   segment. For switching panels of content, use Tabs; for independent on/off buttons, ButtonGroup with
   ToggleButton. */
/** Picks one of a few options shown side by side: a radio group drawn as segments. */
export const SegmentedControl = /* @__PURE__ */ component<HTMLDivElement, SegmentedControlProps>("SegmentedControl", function SegmentedControl(props, ref) {
  const nameRef = useNameCheck("SegmentedControl", NAME_HOW.group);   // warns when it has no accessible name
  const rest = omit(props, OWN);
  const options = props.options || [];
  const disabled = !!props.disabled;
  const invalid = isInvalid(props.invalid, props["aria-invalid"]);
  const truthy = (a: unknown) => a === true || a === "true";
  const readOnly = !!props.readOnly || truthy(props["aria-readonly"]);
  const required = !!props.required || truthy(props["aria-required"]);
  const usable = options.filter((o) => !o.disabled && !disabled);
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState<string | undefined>(props.defaultValue ?? (options.find((o) => !o.disabled) || {}).value);
  const value = controlled ? props.value : own;
  const root = React.useRef<HTMLDivElement | null>(null);
  useFormReset(root, () => { if (!controlled) setOwn(props.defaultValue ?? (options.find((o) => !o.disabled) || {}).value); }, props.form);
  const buttons = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = React.useState<{ x: number; w: number } | null>(null);
  const size = props.size === "sm" || props.size === "lg" ? props.size : "md";
  // In a Field, its label names the group (Field's <label for> can't reach a radiogroup); its own name wins.
  const fieldLabel = useFieldLabel(props.id);
  // ref.current.focus() and autoFocus land on the segment in the Tab order: the selected one, or else the first
  // that isn't disabled (none when all are).
  const tabStop = () => root.current && root.current.querySelector<HTMLElement>('[role=radio][tabindex="0"]');
  useAutoFocus(props.autoFocus, tabStop);

  const choose = (v: string, focus?: boolean) => {
    if (focus) { const b = buttons.current[v]; if (b) b.focus(); }
    if (v === value || readOnly) return;
    if (!controlled) setOwn(v);
    if (props.onValueChange) props.onValueChange(v);
  };
  const measure = React.useCallback(() => {
    const r = root.current, b = value != null ? buttons.current[value] : null;
    if (!r || !b) { setBox(null); return; }
    setBox({ x: b.offsetLeft, w: b.offsetWidth });
  }, [value]);
  useIsoLayoutEffect(measure, [measure, options.length, size, props.fullWidth]);
  React.useEffect(() => {
    const r = root.current;
    if (!r || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(r);
    for (const k in buttons.current) { const b = buttons.current[k]; if (b) ro.observe(b); }
    return () => ro.disconnect();
  }, [measure, options.length]);

  // Your onKeyDown runs first, so preventDefault() in it keeps the control's own handling of that key from running.
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(e as unknown as React.KeyboardEvent<HTMLDivElement>);
    if (!usable.length || e.defaultPrevented) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    // Read-only, the arrows move focus from the focused segment and leave the selection where it is.
    const from = readOnly ? e.currentTarget.dataset.value : value;
    const i = usable.findIndex((o) => o.value === from);
    let n: number;
    switch (e.key) {
      case "ArrowRight": n = i + (rtl ? -1 : 1); break;
      case "ArrowDown": n = i + 1; break;
      case "ArrowLeft": n = i + (rtl ? 1 : -1); break;
      case "ArrowUp": n = i - 1; break;
      case "Home": n = 0; break;
      case "End": n = usable.length - 1; break;
      default: return;
    }
    e.preventDefault();
    choose(usable[(n + usable.length) % usable.length].value, true);
  };
  // onFocus and onBlur fire when focus enters or leaves the control, not as the arrow keys move it between segments.
  const crossing = (e: React.FocusEvent<HTMLDivElement>) => !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget));
  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => { if (rest.onFocus && crossing(e)) rest.onFocus(e); };
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => { if (rest.onBlur && crossing(e)) rest.onBlur(e); };
  const checkedUsable = usable.some((o) => o.value === value);
  return (
    <div {...rest} ref={(n) => { root.current = n; nameRef(n); delegateFocus(n, tabStop); setRef(ref, n); }}
      role="radiogroup" aria-disabled={disabled || undefined}
      aria-invalid={invalid || undefined} aria-required={required || undefined} aria-readonly={readOnly || undefined}
      aria-labelledby={props["aria-labelledby"] ?? (props["aria-label"] ? undefined : fieldLabel)}
      className={cn("dk-segmented", "dk-segmented--size-" + size, props.fullWidth && "dk-segmented--full", disabled && "dk-segmented--disabled", invalid && "dk-segmented--invalid", readOnly && "dk-segmented--readonly", props.className)}
      data-component="segmented-control" data-size={size} onKeyDown={undefined} onFocus={onFocus} onBlur={onBlur}>
      {box ? <span className="dk-segmented__indicator" aria-hidden style={{ left: box.x, width: box.w }} /> : null}
      {options.map((o) => {
        const on = o.value === value, off = disabled || !!o.disabled;
        const icon = asIcon(o.icon);
        const hasLabel = o.label != null && o.label !== false && o.label !== "";
        const tab = off ? -1 : on || (!checkedUsable && usable[0] && usable[0].value === o.value) ? 0 : -1;
        return (
          <button key={o.value} ref={(n) => { buttons.current[o.value] = n; }} type="button" role="radio" aria-checked={on}
            aria-label={o["aria-label"]} disabled={off} tabIndex={tab} data-value={o.value}
            className={cn("dk-segmented__item", on && "dk-segmented__item--selected", !hasLabel && "dk-segmented__item--icon-only")}
            onClick={() => choose(o.value)} onKeyDown={onKeyDown}>
            {icon != null && icon !== false ? <span className="dk-segmented__icon" aria-hidden>{icon}</span> : null}
            {hasLabel ? <span className="dk-segmented__label">{o.label}</span> : null}
          </button>
        );
      })}
      {props.name ? <input type="hidden" name={props.name} form={props.form} value={value ?? ""} disabled={disabled} /> : null}
    </div>
  );
});
