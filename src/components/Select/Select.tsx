"use client";
import * as React from "react";
import { cn, isInvalid, oneOf, omit, setRef, SIZES } from "../../internal/cn";
import { useFormReset } from "../../internal/useFormReset";
import { warnOnce } from "../../internal/warn";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import * as icons from "../../material/builtin";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";

export type SelectOption = string | number | { value: string | number; label?: React.ReactNode; disabled?: boolean };
export interface SelectOptionGroup { label: string; options: SelectOption[]; disabled?: boolean }
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'multiple'> {
  /** 'sm' (24px, text-xs), 'md' (32px, text-sm, default) or 'lg' (44px, text-base): the control heights, like Input. */
  size?: 'sm' | 'md' | 'lg';
  /** A danger border and focus ring, and aria-invalid. */
  invalid?: boolean;
  /** A decorative icon before the text: an icon name or an element. */
  leftIcon?: IconSource;
  /** A first, empty option shown in the placeholder color until something is picked (it can't be picked back). An uncontrolled Select starts on it. */
  placeholder?: string;
  /** The options: strings, { value, label, disabled }, or groups { label, options }. Or pass <option> and <optgroup> children (after these). */
  options?: Array<SelectOption | SelectOptionGroup>;
}

/* Select: a native <select> styled like Input. size "sm", "md" (default) or "lg" (the control heights);
   invalid; leftIcon (decorative); placeholder (a first, empty option shown in the placeholder color until
   something is picked); options (strings, { value, label, disabled } or groups { label, options }) or your own
   <option> children. Renders <span class="dk-select"> around the <select>: className and style go to the box,
   every other prop (value, defaultValue, onChange, name, disabled, required, aria-*…) and ref to the <select>. */
const OWN = { size: 1, invalid: 1, leftIcon: 1, placeholder: 1, options: 1, children: 1, className: 1, style: 1, multiple: 1 } as const;

function optionNodes(list: Array<SelectOption | SelectOptionGroup> | undefined): React.ReactNode[] {
  return (list || []).map(function (o, i) {
    if (o != null && typeof o === "object" && "options" in o && Array.isArray(o.options)) return <optgroup key={"g" + i} label={o.label} disabled={o.disabled}>{optionNodes(o.options)}</optgroup>;
    const v = o != null && typeof o === "object" ? (o as Exclude<SelectOption, string | number>) : { value: o, label: o, disabled: undefined };
    return <option key={String(v.value)} value={v.value} disabled={v.disabled}>{v.label != null ? v.label : v.value}</option>;
  });
}

/** A native <select> styled like Input (ref, value, onChange and every select attribute go to it), with a chevron; className and style go to the box. Label it with <label htmlFor>, aria-label or Field. multiple isn't supported. */
export const Select = /* @__PURE__ */ component<HTMLSelectElement, SelectProps>("Select", function Select(props, ref) {
  const nameRef = useNameCheck("Select", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const rest = omit(props, OWN);
  if ((props as { multiple?: boolean }).multiple) warnOnce("select-multiple", "Serupa.Select: multiple isn't supported (a native multi-select is hard to use); use checkboxes instead. It was ignored.");
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const hasPh = props.placeholder != null && props.placeholder !== "";
  const controlled = rest.value !== undefined;
  if (hasPh && !controlled && rest.defaultValue === undefined) rest.defaultValue = "";   // start on the placeholder
  const [picked, setPicked] = React.useState(controlled ? rest.value : rest.defaultValue), cur = controlled ? rest.value : picked;
  const onChange = rest.onChange;
  rest.onChange = function (e: React.ChangeEvent<HTMLSelectElement>) { if (!controlled) setPicked(e.target.value); if (onChange) onChange(e); };
  // A form reset puts the native <select> back on its default; the placeholder look follows it.
  const own = React.useRef<HTMLSelectElement | null>(null);
  const setRefs = React.useCallback(function (node: HTMLSelectElement | null) { own.current = node; nameRef(node); setRef(ref, node); }, [ref, nameRef]);
  const start = rest.defaultValue;
  useFormReset(own, () => { if (!controlled) setPicked(start); });
  const empty = hasPh && (cur == null || cur === "");
  const left = asIcon(props.leftIcon);
  return (
    <span className={cn("dk-select", "dk-select--size-" + size, invalid && "dk-select--invalid", rest.disabled && "dk-select--disabled", empty && "dk-select--empty", left != null && left !== false && "dk-select--has-icon", props.className)} style={props.style} data-component="select" data-size={size}>
      {left == null || left === false ? null : <span className="dk-select__icon dk-select__icon--left" aria-hidden key="left">{left}</span>}
      <select {...rest} ref={setRefs} className="dk-select__field" key="field">
        {hasPh ? <option value="" disabled key="__placeholder">{props.placeholder}</option> : null}
        {optionNodes(props.options)}
        {props.children}
      </select>
      <span className="dk-select__icon dk-select__icon--chevron" aria-hidden key="chevron"><Icon icon={icons.ExpandMore} /></span>
    </span>
  );
});
