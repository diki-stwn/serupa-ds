"use client";
import * as React from "react";
import { cn, domId, oneOf, SIZES } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { useFormReset } from "../../internal/useFormReset";
import { useFieldsetDisabled } from "../../internal/useFieldsetDisabled";
import { useServerStyles } from "../../internal/serverStyles";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { FieldContext, useFieldControl } from "../../internal/field";
import { delegateFocus } from "../../internal/focus";
import { en as words } from "./labels";

export interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** The rating (controlled), or null for none. Use with onValueChange. */
  value?: number | null;
  /** The rating at first (uncontrolled). */
  defaultValue?: number | null;
  /** Called with the picked rating, or null when it's cleared. */
  onValueChange?: (value: number | null) => void;
  /** How many stars. Default: 5. */
  max?: number;
  /** Half stars can be picked too (each star is two choices). Default: false. */
  allowHalf?: boolean;
  /** Picking the current rating again (a click, Space), Backspace or Delete clears it. Default: false. */
  clearable?: boolean;
  /** Shows the rating without choices: a role="img" named "4.5 out of 5", for reviews and averages. Any fraction is drawn. */
  readOnly?: boolean;
  /** Disables every choice. */
  disabled?: boolean;
  /** Sends the rating with a form (a native radio per choice). */
  name?: string;
  /** The id of a form elsewhere on the page that the radios belong to. */
  form?: string;
  /** Marks a rating required (on the radios). */
  required?: boolean;
  /** Marks the rating invalid (aria-invalid on the group). Field sets it from its error. */
  invalid?: boolean;
  /** 'sm' (20px stars), 'md' (24px, default) or 'lg' (32px). */
  size?: "sm" | "md" | "lg";
}

// Material Symbols "star", drawn twice per star: the empty outline color under, the fill clipped to the star's share.
const STAR = "m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z";
const Star = () => <svg width="1em" height="1em" viewBox="0 -960 960 960" aria-hidden focusable="false"><path d={STAR} /></svg>;
const round = (n: number, by: number) => Math.round(n / by) * by;

/* Rating: stars to pick a score, or to show one. In a Field, the label names the group (aria-labelledby). Interactive, it's a role="radiogroup" of native radios, one per
   star (two per star with allowHalf), each named by the ratingStars label ("3 stars") and laid over its star (or
   half), so the arrow keys, Tab, forms and screen readers work as for any radio group; the stars up to the
   pointer light up while it hovers. With clearable, picking the current rating again, Backspace or Delete clears
   it. readOnly draws the stars as one role="img" named by the ratingValue label ("4.5 out of 5"). */
/** Stars to pick a rating (a radio group) or to show one (readOnly: an image named "4.5 out of 5"). */
export const Rating = /* @__PURE__ */ component<HTMLDivElement, RatingProps>("Rating", function Rating(given, ref) {
  const props = useFieldControl(given);   // a surrounding Field's id, hint, required, invalid and disabled
  const fieldLabel = React.useContext(FieldContext)?.labelId;   // a Field's <label for> can't name a group, so it's aria-labelledby
  const { invalid, value: valueIn, defaultValue, onValueChange, max: maxIn, allowHalf, clearable, readOnly, disabled, name, form, required, size: sizeIn, className, onKeyDown, onPointerLeave, ...rest } = props;
  const nameRef = useNameCheck("Rating", NAME_HOW.group);
  const sds = useSettings(words);
  const size = oneOf(SIZES, sizeIn, "md");
  const max = typeof maxIn === "number" && maxIn >= 1 ? Math.floor(maxIn) : 5;
  const step = allowHalf ? 0.5 : 1;
  const fit = (n: number | null | undefined) => (typeof n === "number" && isFinite(n) && n > 0 ? Math.min(max, n) : null);
  const controlled = valueIn !== undefined;
  const [own, setOwn] = React.useState<number | null>(() => fit(defaultValue));
  const value = controlled ? fit(valueIn) : own;
  const [hover, setHover] = React.useState<number | null>(null);
  const root = React.useRef<HTMLDivElement | null>(null);
  const auto = domId("dk-rating", React.useId());
  // form: a rating outside the form it names is reset with that form too, as Slider and SegmentedControl are.
  useFormReset(root, () => { if (!controlled) setOwn(fit(defaultValue)); }, form);
  // A disabled <fieldset> around it turns the radios off natively; the stars then act and look disabled too (L8E71).
  const inDisabledFieldset = useFieldsetDisabled(root);
  const off = !!disabled || inDisabledFieldset;

  const set = (n: number | null) => {
    if (n === value) return;
    if (!controlled) setOwn(n);
    if (onValueChange) onValueChange(n);
  };
  // The choice the stars draw: a value between the choices (3.3, or 3.7 with halves) checks the radio of the star it shows (L8E61).
  const picked = value == null ? null : round(value, step);
  const shown = readOnly ? value : hover ?? picked;
  const stars = Array.from({ length: max }, (_, i) => {
    const share = shown == null ? 0 : Math.min(1, Math.max(0, shown - i));
    return { i, fill: Math.round(share * 100) + "%" };
  });
  const box = (children: React.ReactNode, i: number, fill: string) => (
    <span key={i} className="dk-rating__star" style={{ "--dk-rating-share": fill } as React.CSSProperties}>
      <span className="dk-rating__empty"><Star /></span>
      <span className="dk-rating__fill"><Star /></span>
      {children}
    </span>
  );
  const styled = useServerStyles<HTMLDivElement>();   // each star's share, from server HTML under a strict CSP (GR10)
  // A Field's label click and ref.current.focus() (a form library focusing the first invalid field) land on the
  // star in the Tab order, the picked one or else the first; the <div> took no focus (L8E89).
  const ref2 = (n: HTMLDivElement | null) => { root.current = n; if (!readOnly) delegateFocus(n, () => n && (n.querySelector<HTMLElement>("input:checked:enabled") || n.querySelector<HTMLElement>("input:enabled"))); nameRef(n); styled(n); if (typeof ref === "function") ref(n); else if (ref) ref.current = n; };
  const classes = cn("dk-rating", "dk-rating--size-" + size, readOnly && "dk-rating--readonly", off && "dk-rating--disabled", className);

  if (readOnly) {
    const said = value == null ? 0 : Math.round(value * 10) / 10;
    return <div {...rest} ref={ref2} role="img" aria-label={rest["aria-label"] ? rest["aria-label"] + ", " + sds.labels.ratingValue(said, max) : sds.labels.ratingValue(said, max)}
      className={classes} data-component="rating" data-size={size}>{stars.map((s) => box(null, s.i, s.fill))}</div>;
  }
  const radios = (i: number) => {
    const choices = allowHalf ? [i + 0.5, i + 1] : [i + 1];
    return choices.map((v) => (
      <input key={v} type="radio" className="dk-rating__choice"
        name={name || auto} form={form} value={v} checked={picked === v} disabled={disabled} required={required} aria-label={sds.labels.ratingStars(v)}
        onChange={() => set(v)} onClick={() => { if (clearable && picked === v) set(null); }}
        onPointerEnter={(e) => { if (!off && e.pointerType !== "touch") setHover(v); }} />
    ));
  };
  // A Field's required arrives as aria-required (L8E88): it was dropped, since the group's own attribute came after rest.
  return (
    <div {...rest} ref={ref2} role="radiogroup" aria-labelledby={rest["aria-labelledby"] || (rest["aria-label"] ? undefined : fieldLabel)}
      aria-invalid={invalid || undefined} aria-disabled={off || undefined} aria-required={required || rest["aria-required"] === true || rest["aria-required"] === "true" || undefined} className={classes}
      data-component="rating" data-size={size}
      onPointerLeave={(e) => { if (onPointerLeave) onPointerLeave(e); setHover(null); }}
      onKeyDown={(e) => {
        if (onKeyDown) onKeyDown(e);
        if (!e.defaultPrevented && clearable && !off && (e.key === "Backspace" || e.key === "Delete"
          // a browser clicks a radio on Space only when it isn't checked yet, so Space on the picked star clears it here
          || (e.key === " " && (e.target as HTMLInputElement).checked))) { e.preventDefault(); set(null); }
      }}>
      {stars.map((s) => box(radios(s.i), s.i, s.fill))}
    </div>
  );
});
