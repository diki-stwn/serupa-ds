"use client";
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { named } from "../../internal/component";
import { FieldContext, type FieldControl } from "../../internal/field";
import * as icons from "../../material/builtin";
import { FieldLabel } from "../../internal/fieldLabel";
import { useSettings } from "../../internal/provider";
import { announce, ensureAnnouncer } from "../../internal/announce";
import { warnOnce } from "../../internal/warn";
import { en as words } from "./labels";

// module state: a fixed list, never changed.
const LABELABLE = new Set(["select", "button", "meter", "output", "progress", "textarea"]);

export interface FieldProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The label: a <label> linked to the control, or with group, the fieldset's <legend>. */
  label?: React.ReactNode;
  /** Help text under the label, before the control (text-muted); added to the control's aria-describedby. */
  hint?: React.ReactNode;
  /** An error message under the control (danger-text, with an icon); makes the control invalid and is added to its aria-describedby. */
  error?: React.ReactNode;
  /** A * after the label (hidden from screen readers) and aria-required on the control; with group, "Required" in words in the legend for screen readers. Add the control's own required for the browser's check. */
  required?: boolean;
  /** "(optional)" after the label, or your own words. Ignored with required. */
  optional?: boolean | string;
  /** Disables the control (with group, every control in the fieldset) and dims the label and hint. */
  disabled?: boolean;
  /** A <fieldset> with a <legend> for a set of checkboxes or radios; the hint and error describe the fieldset. */
  group?: boolean;
  /** 'vertical' (default): label, hint, control and error stacked. 'horizontal': the label in a column at the start
   *  (--field-label-width) on the control's first line, with the control, hint and error beside it, for dense
   *  settings forms; it stacks again when the field is too narrow for both. Not with group. */
  layout?: 'vertical' | 'horizontal';
  /** The control's id; by default the control's own id, or a generated one. */
  id?: string;
  /** One control (Input, Textarea, Select or any element), or with group, the set. */
  children?: React.ReactNode;
}

/* Field: a label, an optional hint and an error message around one form control. It gives the control an id
   (unless it has one), at any depth (through FieldContext), links the label to it, adds the hint and error to its aria-describedby, and passes
   invalid (with error), aria-required (with required) and disabled. group renders a <fieldset> with a <legend>
   instead, for a set of checkboxes or radios, and puts the hint and error on the fieldset. */
/** The props Field reads from and hands to its control (a component like Input, or a DOM element). */
type ControlProps = { id?: string; invalid?: boolean; disabled?: boolean; "aria-describedby"?: string; "aria-errormessage"?: string; "aria-required"?: boolean | "true" | "false"; "aria-invalid"?: boolean };

const OWN = { label: 1, hint: 1, error: 1, required: 1, optional: 1, disabled: 1, group: 1, layout: 1, id: 1, children: 1, className: 1 } as const;

/** A label, an optional hint and an error message around one form control, wired up for screen readers. className and other attributes go to the outer element. */
export const Field = /* @__PURE__ */ named("Field", function Field(props: FieldProps): React.ReactElement {
  const rest = omit(props, OWN);
  const base = domId("dk-f", React.useId());
  const child = React.Children.count(props.children) === 1 && React.isValidElement(props.children) ? (props.children as React.ReactElement<ControlProps>) : null;
  const controlId = props.id || (child && child.props.id) || base + "-control";
  const hasError = props.error != null && props.error !== false && props.error !== "";
  const hintId = props.hint ? base + "-hint" : null, errorId = hasError ? base + "-error" : null;
  const group = !!props.group;
  const sds = useSettings(words);
  // An error that appears (or changes) after mount is said politely: it's only a description, which
  // screen readers read on focus, and focus is usually elsewhere (the submit button) when it shows.
  const errorRef = React.useRef<HTMLSpanElement>(null);
  const said = React.useRef<string | null>(null);
  React.useEffect(function () { ensureAnnouncer(); }, []);   // no cleanup: the region is shared
  // every render: the error is the caller's children, so its text can change in any render; reading it is cheap.
  React.useEffect(function () {
    const text = errorRef.current ? errorRef.current.textContent || "" : "";
    if (said.current !== null && text && text !== said.current) announce(text);
    said.current = text;
  });
  // The label points at the control by id: say so when nothing on the page has it.
  // every render: the control is the caller's children and can come or go in any render; it warns once.
  React.useEffect(function () {
    if (process.env.NODE_ENV !== "production" && !group && props.label != null && !document.getElementById(controlId)) {
      warnOnce("field-control", "Field: no element has the id \"" + controlId + "\", so the label names nothing. Put the control inside the Field, or pass its id.");
    }
  });
  /* A label only focuses a labelable element (an input, select, button). Slider, SegmentedControl and ColorPicker
     have a <div> root, which hands focus to its thumb or checked option: clicking the label focuses that, as
     clicking an input's label does. */
  const focusControl = function (e: React.MouseEvent<HTMLLabelElement>) {
    if (e.currentTarget.control) return;
    const el = document.getElementById(controlId);
    if (el) el.focus();
  };
  const labelKids = [props.label,
    props.required ? <span className="dk-field__required" aria-hidden key="req">*</span> : null,
    // A fieldset can't carry aria-required, and the * is hidden: with group, the legend says it in words (FR1), so the
    // group is read as "Contact by, Required" whatever it holds.
    props.required && group ? <span className="dk-visually-hidden" key="req-said">{" " + sds.labels.required}</span> : null,
    !props.required && props.optional ? <span className="dk-field__optional" key="opt">{typeof props.optional === "string" ? props.optional : sds.labels.fieldOptional}</span> : null];
  const label = props.label == null ? null : group
    ? React.createElement("legend", { className: "dk-field__label", key: "label" }, ...labelKids)
    : React.createElement("label", { className: "dk-field__label", htmlFor: controlId, id: base + "-label", key: "label", onClick: focusControl }, ...labelKids);
  const hint = props.hint ? <div className="dk-field__hint" id={hintId as string} key="hint">{props.hint}</div> : null;
  const error = hasError ? <div className="dk-field__error" key="error"><Icon icon={icons.Error} className="dk-field__error-icon" /><span id={errorId as string} ref={errorRef}>{props.error}</span></div> : null;
  const described = cn(hintId, errorId);
  const pass = function (el: React.ReactNode, isControl: boolean) {   // the props Field hands a control: components get invalid, DOM elements aria-invalid
    if (!React.isValidElement(el)) return el;
    const p = el.props as ControlProps & { children?: React.ReactNode };
    const add: ControlProps = {}, dom = typeof el.type === "string";
    // A plain element holding other elements is a wrapper, not the control: the control inside reads FieldContext.
    // A labelable element is the control even with element children (a <select>'s options, a <button>'s icon).
    if (isControl && dom && !LABELABLE.has(el.type as string) && React.Children.toArray(p.children).some(React.isValidElement)) return el;
    if (isControl) {
      if (!p.id) add.id = controlId;
      if (described) add["aria-describedby"] = cn(p["aria-describedby"], described);
      // The error stays in the description too: aria-errormessage alone isn't read by every screen reader yet.
      if (errorId && p["aria-errormessage"] == null) add["aria-errormessage"] = errorId;
      if (props.required && p["aria-required"] == null) add["aria-required"] = true;
    }
    if (hasError) { if (dom) add["aria-invalid"] = true; else add.invalid = true; }
    if (props.disabled && !group) add.disabled = true;
    return React.cloneElement(el, add);
  };
  const horizontal = !group && props.layout === "horizontal";
  const cls = cn("dk-field", group && "dk-field--group", horizontal && "dk-field--horizontal", hasError && "dk-field--invalid", props.disabled && "dk-field--disabled", props.className);
  if (group) {
    return (
      <fieldset {...rest} className={cls} disabled={props.disabled || undefined} aria-describedby={described || undefined} data-component="field">
        {label}
        {hint}
        <FieldContext.Provider value={null}>
          <div className="dk-field__control" key="control">{React.Children.map(props.children, function (c) { return pass(c, false); })}</div>
        </FieldContext.Provider>
        {error}
      </fieldset>
    );
  }
  // The control can be any depth down (in a Tooltip, a wrapper component): it reads this.
  const control: FieldControl = { id: controlId, labelId: props.label == null ? undefined : base + "-label", describedBy: described || undefined, errorMessage: errorId || undefined, required: props.required || undefined, invalid: hasError || undefined, disabled: props.disabled || undefined };
  const body = <FieldContext.Provider value={control} key="body">
    <div className="dk-field__control" key="control">
      <FieldLabel value={label ? { control: controlId, label: base + "-label" } : null}>{child ? pass(child, true) : props.children}</FieldLabel>
    </div>
  </FieldContext.Provider>;
  // Horizontal: the label beside a column holding the control, then the hint and the error under it.
  if (horizontal) return <div {...rest} className={cls} data-component="field" data-layout="horizontal">{label}<div className="dk-field__body">{body}{hint}{error}</div></div>;
  return (
    <div {...rest} className={cls} data-component="field">
      {label}
      {hint}
      {body}
      {error}
    </div>
  );
});
