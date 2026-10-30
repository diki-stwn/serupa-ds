"use client";
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { component } from "../../internal/component";
import { colorName, contrastRatio, normalizeHex } from "../../internal/color";
import { delegateFocus, useAutoFocus } from "../../internal/focus";
import { FieldContext } from "../../internal/field";
import { isComposing } from "../../internal/ime";
import { useFieldLabel } from "../../internal/fieldLabel";
import { useFormReset } from "../../internal/useFormReset";
import { useLocale, useSettings } from "../../internal/provider";
import { Icon } from "../Icon/Icon";
import { Input } from "../Input/Input";
import * as icons from "../../material/builtin";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { en as words } from "./labels";

/** A swatch: its color as hex, and its name in words ("Ocean"), which is what screen readers say. */
export interface ColorSwatch { value: string; label: string }

export interface ColorPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The colors to pick from: { value: "#1d4ed8", label: "Ocean" }, or a hex string, which gets a rough name from
      its color ("Dark blue", the colorName label) and its code as a tooltip. */
  swatches: ReadonlyArray<ColorSwatch | string>;
  /** The color, as #rrggbb (controlled). Use with onValueChange. null: none picked. */
  value?: string | null;
  /** The color at first (uncontrolled). */
  defaultValue?: string | null;
  /** Called with the new color, always lowercase #rrggbb, as it changes: also on every step while dragging in the
      browser's color picker, and as a hex code is typed. */
  onValueChange?: (value: string) => void;
  /** Called with the color once it's chosen: a swatch picked, the browser's color picker closed, or the hex field
      left or Enter pressed. Not while dragging or typing, so it fits saving or other costly work. */
  onValueCommit?: (value: string) => void;
  /** A hex field and the browser's color picker after the swatches, for any color. Default: true. */
  custom?: boolean;
  /** A color to check the picked one against (the background it goes on, or the text on it): shows the WCAG ratio. */
  contrastWith?: string;
  /** The ratio below which it warns. Default: 4.5 (text); 3 for large text and icons. */
  minContrast?: number;
  /** 'sm' (24px swatches) or 'md' (32px, default). */
  size?: 'sm' | 'md';
  /** Turns every swatch and the hex field off, as a disabled native control. */
  disabled?: boolean;
  /** Submits the color with a form, in a hidden input. */
  name?: string;
  /** The id of the form the color submits with, when the picker sits outside it (like an input's form attribute). */
  form?: string;
  /** A color must be picked: aria-required on the swatches, and a form isn't submitted without one. In a required Field, it's set for you. */
  required?: boolean;
  /** Marks the swatches invalid (aria-invalid). In a Field with an error, it's set for you. */
  invalid?: boolean;
}

const OWN = { "aria-label": 1, "aria-labelledby": 1, swatches: 1, value: 1, defaultValue: 1, onValueChange: 1, onValueCommit: 1, custom: 1, contrastWith: 1, minContrast: 1, size: 1, disabled: 1, name: 1, className: 1, form: 1, required: 1, invalid: 1, "aria-describedby": 1, "aria-errormessage": 1, "aria-required": 1, "aria-invalid": 1, autoFocus: 1 } as const;
type Swatch = ColorSwatch & { named: boolean };
// The check on a swatch: white or black, whichever stands out more on it.
const ink = (hex: string) => ((contrastRatio(hex, "#ffffff") || 0) >= (contrastRatio(hex, "#000000") || 0) ? "#ffffff" : "#000000");

/* ColorPicker: a radio group of swatches (one Tab stop; the arrow keys, Home and End move and pick), then, with
   custom, a hex field and the browser's own color picker for any other color. With contrastWith it shows the WCAG
   contrast ratio between the picked color and that one, and warns below minContrast, in a polite live region.
   Colors go in and come out as lowercase #rrggbb. className and other props go to the outer <div>. */
/** Swatches to pick a color from, a hex field for any other, and a contrast check against a background. */
export const ColorPicker = /* @__PURE__ */ component<HTMLDivElement, ColorPickerProps>("ColorPicker", function ColorPicker(props, ref) {
  const nameRef = useNameCheck("ColorPicker", NAME_HOW.group);   // warns when it has no accessible name
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const sds = useSettings(words), locale = useLocale();
  // A swatch without a name (a hex string, or an empty label) is named from its color: "Dark blue", not "#1e3a8a".
  const swatches: Swatch[] = (props.swatches || []).map((s) => {
    const sw = typeof s === "string" ? { value: s, label: "" } : s;
    const value = normalizeHex(sw.value) || sw.value;
    if (sw.label) return { value, label: sw.label, named: true };
    const c = colorName(value);
    return { value, label: c ? sds.labels.colorName(c.hue, c.tone) : value, named: false };
  });
  const base = domId("dk-cp", React.useId());
  const root = React.useRef<HTMLDivElement | null>(null);
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState<string | null>(normalizeHex(props.defaultValue || "") );
  const value = controlled ? normalizeHex(props.value || "") : own;
  const disabled = !!props.disabled, custom = props.custom !== false;
  const truthy = (v: unknown) => v === true || v === "true";
  const required = !!props.required || truthy(props["aria-required"]);
  // A form submitted with nothing picked: the swatches are marked invalid and take focus, until a color is picked.
  const [missing, setMissing] = React.useState(false);
  if (missing && value) setMissing(false);
  const invalid = !!props.invalid || truthy(props["aria-invalid"]) || missing;
  const size = props.size === "sm" ? "sm" : "md";
  const [text, setText] = React.useState((value || "").replace("#", ""));
  const typing = React.useRef(false);
  // A code on its way to six digits ("1d4") isn't marked invalid until Enter: only one that can't become a color is.
  const [tried, setTried] = React.useState(false);
  const bad = text !== "" && (/[^0-9a-f]/i.test(text) || text.length > 6 || (tried && !normalizeHex(text)));
  /* The field follows the color: on blur it shows the current one, and if the parent takes the typed color the
     change brings it here; a parent that turns it down leaves the field on its own color, not the rejected text. */
  React.useEffect(() => { if (!typing.current) setText((value || "").replace("#", "")); }, [value]);
  // The group's name: aria-label or aria-labelledby, or a surrounding Field's label.
  const fieldLabel = useFieldLabel(props.id);
  const labelledBy = props["aria-labelledby"] ?? (props["aria-label"] ? undefined : fieldLabel);

  // The last color given to onValueCommit, so a commit fires once per real change.
  const committed = React.useRef(value);
  const commit = (v: string) => {
    if (v === committed.current) return;
    committed.current = v;
    if (props.onValueCommit) props.onValueCommit(v);
  };
  const commitRef = React.useRef(commit);
  commitRef.current = commit;
  // A form reset puts the first color back (uncontrolled), as a native input does.
  const hidden = React.useRef<HTMLInputElement>(null);
  // The hidden input knows its form even through the form attribute; without a name, the picker's own form.
  useFormReset(props.name ? hidden : root, () => { if (!controlled) { const d = normalizeHex(props.defaultValue || ""); setOwn(d); committed.current = d; } });
  // React's onChange on <input type="color"> fires on every step of a drag; the native change event fires once the
  // picker closes, which is the commit.
  const native = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    const el = native.current;
    if (!el) return;
    // A color dragged to and back to where it started fires input but no change: it's chosen when the well loses focus.
    let moved = false;
    const on = () => { moved = false; const v = normalizeHex(el.value); if (v) commitRef.current(v); };
    // With nothing picked the well holds #000000, so picking black is no change to React (it skips onChange).
    const input = () => { moved = true; if (valueRef.current === null && el.value === "#000000") chooseRef.current(el.value, false, false); };
    const blur = () => { if (moved) on(); };
    el.addEventListener("change", on);
    el.addEventListener("input", input);
    el.addEventListener("blur", blur);
    return () => { el.removeEventListener("change", on); el.removeEventListener("input", input); el.removeEventListener("blur", blur); };
  }, [custom]);
  const choose = (hex: string, focus?: boolean, final = true) => {
    if (disabled) return;
    const v = normalizeHex(hex);
    if (!v) return;
    if (!controlled) setOwn(v);
    if (v !== value && props.onValueChange) props.onValueChange(v);
    if (final) commit(v);
    if (focus && root.current) {
      const b = root.current.querySelector<HTMLButtonElement>(`.dk-color-picker__swatch[data-value="${v}"]`);
      if (b) b.focus();
    }
  };
  const chooseRef = React.useRef(choose);
  chooseRef.current = choose;
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const picked = swatches.findIndex((s) => s.value === value);
  const tabStop = picked >= 0 ? picked : 0;
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.defaultPrevented || !swatches.length) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const i = swatches.findIndex((s) => s.value === e.currentTarget.dataset.value);
    let n: number;
    switch (e.key) {
      case "ArrowRight": n = i + (rtl ? -1 : 1); break;
      case "ArrowDown": n = i + 1; break;
      case "ArrowLeft": n = i + (rtl ? 1 : -1); break;
      case "ArrowUp": n = i - 1; break;
      case "Home": n = 0; break;
      case "End": n = swatches.length - 1; break;
      default: return;
    }
    e.preventDefault();
    choose(swatches[(n + swatches.length) % swatches.length].value, true);
  };

  const onInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    setMissing(true);
    // Only the form's first invalid field takes focus, as the browser would do.
    const form = e.currentTarget.form;
    const first = form ? Array.from(form.elements).find((x) => (x as HTMLInputElement).willValidate && !(x as HTMLInputElement).validity.valid) : e.currentTarget;
    const b = root.current?.querySelectorAll<HTMLButtonElement>(".dk-color-picker__swatch")[tabStop];
    if (first === e.currentTarget && b) b.focus();
  };
  const ratio = props.contrastWith && value ? contrastRatio(value, props.contrastWith) : null;
  const min = props.minContrast && props.minContrast > 1 ? props.minContrast : 4.5;
  // Rounded down, so 4.49 never shows as 4.5 and passes by eye.
  const fmt = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(Math.floor(n * 10) / 10);
  const low = ratio != null && ratio < min;
  useAutoFocus(props.autoFocus, () => root.current && root.current.querySelectorAll<HTMLButtonElement>(".dk-color-picker__swatch")[tabStop]);
  return (
    <div {...rest} ref={(n) => { root.current = n; delegateFocus(n, () => n && n.querySelectorAll<HTMLButtonElement>(".dk-color-picker__swatch")[tabStop]); restyle(n); }} className={cn("dk-color-picker", "dk-color-picker--size-" + size, disabled && "dk-color-picker--disabled", props.className)}
      data-component="color-picker" data-size={size}>
      {/* The description and states a Field hands the picker go on the radiogroup, the control screen readers reach.
          The id stays on the outer div, so a label click focuses the picked swatch through it. */}
      <div ref={nameRef} role="radiogroup" className="dk-color-picker__swatches" aria-label={props["aria-label"]} aria-labelledby={labelledBy} aria-disabled={disabled || undefined}
        aria-describedby={props["aria-describedby"]} aria-required={required || undefined} aria-invalid={invalid || undefined} aria-errormessage={invalid ? props["aria-errormessage"] : undefined}>
        {swatches.map((s, i) => {
          const on = s.value === value;
          // With contrastWith, every swatch says its ratio before it's picked, and one under minContrast is marked.
          const r = props.contrastWith ? contrastRatio(s.value, props.contrastWith) : null;
          const weak = r != null && r < min;
          const why = r != null ? sds.labels.contrast(fmt(r)) + (weak ? ", " + sds.labels.lowContrast(fmt(min)) : "") : "";
          return (
            <button key={s.value + i} type="button" role="radio" aria-checked={on} aria-label={s.label} title={s.named ? s.label : s.value} data-value={s.value}
              aria-describedby={why ? base + "-" + i : undefined} data-low-contrast={weak ? "" : undefined}
              className={cn("dk-color-picker__swatch", on && "dk-color-picker__swatch--checked", weak && "dk-color-picker__swatch--low")} style={{ "--dk-swatch": s.value, "--dk-swatch-ink": ink(s.value) } as React.CSSProperties}
              tabIndex={i === tabStop ? 0 : -1} disabled={disabled} onClick={() => choose(s.value)} onKeyDown={onKeyDown}>
              {on ? <Icon icon={icons.Check} className="dk-color-picker__check" /> : null}
              {why ? <span hidden id={base + "-" + i}>{why}</span> : null}
            </button>
          );
        })}
      </div>
      {custom ? (
        // The hex field is a second field of the picker, named "Hex code": not the control a Field labels.
        <FieldContext.Provider value={null}><div className="dk-color-picker__custom">
          <input ref={native} type="color" className="dk-color-picker__native" aria-label={sds.labels.customColor} value={value || "#000000"} disabled={disabled} data-empty={value ? undefined : ""}
            onChange={(e) => choose(e.target.value, false, false)} />
          <Input size="sm" className="dk-color-picker__hex" aria-label={sds.labels.hexCode} value={text} disabled={disabled} maxLength={7} spellCheck={false} autoComplete="off"
            leftIcon={<span className="dk-color-picker__hash">#</span>} aria-invalid={bad || undefined}
            onFocus={() => { typing.current = true; }}
            onChange={(e) => { const t = e.target.value.replace(/^#/, ""); setText(t); setTried(false); const v = normalizeHex(t); if (v && t.length === 6) choose(v, false, false); }}
            // A copied code often comes with a space or a newline, which maxLength would cut before it's trimmed.
            onPaste={(e) => { const t = e.clipboardData.getData("text").trim().replace(/^#/, ""); if (!normalizeHex(t)) return; e.preventDefault(); setText(t); setTried(false); if (t.length === 6) choose(t, false, false); }}
            onBlur={() => { typing.current = false; setTried(false); const v = normalizeHex(text); if (v) choose(v); setText((value || "").replace("#", "")); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !isComposing(e)) { const v = normalizeHex(text); if (v) { choose(v); setText(v.slice(1)); } else setTried(true); } }} />
        </div></FieldContext.Provider>
      ) : null}
      {props.contrastWith ? (
        <div className={cn("dk-color-picker__contrast", low && "dk-color-picker__contrast--low")} aria-live="polite">
          {ratio != null ? <>{low ? <Icon icon={icons.Warning} className="dk-color-picker__warning" /> : null}<span>{sds.labels.contrast(fmt(ratio))}{low ? ", " + sds.labels.lowContrast(fmt(min)) : ""}</span></> : null}
        </div>
      ) : null}
      {/* required: a hidden-from-view field the form checks; no browser bubble on it, the swatches take focus instead. */}
      {required ? <input className="dk-color-picker__validity" tabIndex={-1} aria-hidden required value={value || ""} onChange={() => {}} disabled={disabled} form={props.form}
        onInvalid={onInvalid} /> : null}
      {props.name ? <input ref={hidden} type="hidden" name={props.name} form={props.form} value={value || ""} disabled={disabled} /> : null}
    </div>
  );
});
