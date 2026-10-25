"use client";
import * as React from "react";
import { cn, domId, isInvalid, oneOf, omit, setRef, SIZES, useIsoLayoutEffect } from "../../internal/cn";
import { useFormReset } from "../../internal/useFormReset";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import * as icons from "../../material/builtin";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** 'sm' (14px box, text-xs), 'md' (16px, text-sm, default) or 'lg' (20px, text-base). */
  size?: 'sm' | 'md' | 'lg';
  /** The label, next to the box; a click on it toggles the box. Without one, give the checkbox an aria-label. */
  children?: React.ReactNode;
  /** A second, muted line under the label, linked to the checkbox with aria-describedby. */
  description?: React.ReactNode;
  /** The "some" state, such as a select-all box when only some rows are picked: a dash, announced as mixed. Set it from your state; a click clears it natively. */
  indeterminate?: boolean;
  /** A danger border (while unchecked) and focus ring, and aria-invalid. */
  invalid?: boolean;
  /** Focusable and read out (aria-readonly), but a click or Space doesn't change it; a checked box is still submitted. */
  readOnly?: boolean;
  /** In a CheckboxGroup: the box that checks or clears every other box. It's checked when all are, and indeterminate when some are. Leave out value. */
  selectAll?: boolean;
}

/** V is the boxes' value type: string (or number) as you use them, inferred from value, defaultValue or onValueChange. */
export interface CheckboxGroupProps<V extends string | number = string | number> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /** The checked boxes' values (controlled). Use with onValueChange. */
  value?: readonly V[];
  /** The values checked at first (uncontrolled). Default: none. */
  defaultValue?: readonly V[];
  /** Called with the new list of checked values (in the boxes' order) and the change event. */
  onValueChange?: (value: V[], event: React.ChangeEvent<HTMLInputElement>) => void;
  /** The boxes' name, so each checked one is submitted with its value; a generated one by default. */
  name?: string;
  /** 'vertical' (stacked, default) or 'horizontal' (a wrapping row). */
  orientation?: 'vertical' | 'horizontal';
  /** The boxes' size, unless a Checkbox sets its own. */
  size?: 'sm' | 'md' | 'lg';
  /** A danger border on every unchecked box, and aria-invalid on the group. Field sets it from its error. */
  invalid?: boolean;
  /** Disables every box. */
  disabled?: boolean;
  /** At least one box must be checked: aria-required on the group, and the browser won't submit the form until one is. */
  required?: boolean;
  /** The Checkbox elements, at any depth. */
  children?: React.ReactNode;
}

interface GroupContextValue {
  name: string;
  values: readonly string[];
  size: unknown;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
  /** The boxes in the group, in the order they mounted, and which are disabled (select-all leaves those as they are). */
  boxes: Map<string, boolean>;
  register(value: string | number, disabled: boolean): () => void;
  toggle(value: string, on: boolean, event: React.ChangeEvent<HTMLInputElement>): void;
  toggleAll(on: boolean, event: React.ChangeEvent<HTMLInputElement>): void;
}
const GroupContext = /* @__PURE__ */ React.createContext<GroupContextValue | null>(null);

/* CheckboxGroup: any number of choices from a set of Checkboxes. It names them (name, or a generated one), holds the
   checked values (value with onValueChange, or defaultValue), and passes size, invalid, disabled and required down.
   A Checkbox with selectAll checks or clears the rest. Renders <div role="group">: label it with Field group (a
   fieldset and legend), aria-label or aria-labelledby. */
const GROUP_OWN = { name: 1, value: 1, defaultValue: 1, onValueChange: 1, orientation: 1, size: 1, invalid: 1, disabled: 1, required: 1, children: 1, className: 1 } as const;

/** Any number of choices from a set of Checkboxes: a <div role="group"> that names them, holds the checked values and passes size, invalid, disabled and required down. A Checkbox with selectAll checks or clears the rest. */
export const CheckboxGroup = /* @__PURE__ */ component<HTMLDivElement, CheckboxGroupProps>("CheckboxGroup", function CheckboxGroup(props: CheckboxGroupProps, ref) {
  const rest = omit(props, GROUP_OWN);
  const autoName = domId("dk-cbg", React.useId());
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState<readonly (string | number)[]>(props.defaultValue || []);
  const raw = (controlled ? props.value : own) || [];
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  const orientation = props.orientation === "horizontal" ? "horizontal" : "vertical";
  const root = React.useRef<HTMLDivElement | null>(null);
  const [, rerender] = React.useState(0);
  useFormReset(root, function () { if (!controlled) setOwn(props.defaultValue || []); rerender(function (n) { return n + 1; }); });
  // The boxes register as they mount, so select-all knows them all and the values come out in their order.
  const boxes = React.useRef(new Map<string, boolean>()).current;
  // The values as the caller gave them and the boxes hold them (numbers stay numbers), looked up by their text, which is what an <input> holds.
  const typed = React.useRef(new Map<string, string | number>()).current;
  for (const v of raw) typed.set(String(v), v);
  const latest = React.useRef(raw); latest.current = raw;
  const emit = function (next: Set<string>, e: React.ChangeEvent<HTMLInputElement>) {
    const order = [...boxes.keys()].filter((k) => next.has(k)).concat([...next].filter((k) => !boxes.has(k)));
    const out = order.map((k) => (typed.has(k) ? typed.get(k)! : k));
    if (!controlled) setOwn(out);
    if (props.onValueChange) props.onValueChange(out, e);
  };
  const ctx: GroupContextValue = {
    name: props.name || autoName, values: raw.map(String), size: props.size, invalid, disabled: !!props.disabled, required: !!props.required, boxes,
    register(v, dis) { const k = String(v); boxes.set(k, dis); typed.set(k, v); rerender((n) => n + 1); return () => { boxes.delete(k); rerender((n) => n + 1); }; },
    toggle(v, on, e) { const next = new Set(latest.current.map(String)); if (on) next.add(v); else next.delete(v); emit(next, e); },
    toggleAll(on, e) {
      const next = new Set(latest.current.map(String));
      boxes.forEach((dis, k) => { if (!dis) { if (on) next.add(k); else next.delete(k); } });
      emit(next, e);
    },
  };
  return (
    <div {...rest} ref={function (n) { root.current = n; setRef(ref, n); }} role="group" aria-invalid={invalid || undefined} aria-required={props.required || undefined} aria-disabled={props.disabled || undefined}
      className={cn("dk-checkbox-group", "dk-checkbox-group--" + orientation, invalid && "dk-checkbox-group--invalid", props.className)} data-component="checkbox-group" data-orientation={orientation}>
      <GroupContext.Provider value={ctx}>{props.children}</GroupContext.Provider>
    </div>
  );
}) as (<V extends string | number = string | number>(props: CheckboxGroupProps<V> & React.RefAttributes<HTMLDivElement>) => React.ReactElement | null) & { displayName?: string };

/* Checkbox: a native checkbox and its label. size "sm", "md" (default) or "lg"; children (the label);
   description (a second, muted line, linked with aria-describedby); indeterminate (the "some" state of a
   select-all box, drawn as a dash and announced as mixed); invalid. Renders <label class="dk-checkbox"> around the
   box and the text, so a click anywhere on it toggles: className and style go to the label, every other prop
   (checked, defaultChecked, onChange, name, value, disabled, required, aria-*…) and ref to the <input>. */
const OWN = { size: 1, invalid: 1, indeterminate: 1, selectAll: 1, description: 1, children: 1, className: 1, style: 1, type: 1 } as const;

/** A native checkbox with its label (ref, checked, onChange and every input attribute go to the <input>); className and style go to the <label> around it. */
export const Checkbox = /* @__PURE__ */ component<HTMLInputElement, CheckboxProps>("Checkbox", function Checkbox(props, ref) {
  const group = React.useContext(GroupContext);
  // In a group, the group's Field labels and describes the group, not each box.
  const fromField = useFieldControl(props);
  if (!group) props = fromField;
  const rest = omit(props, OWN);
  const size = oneOf(SIZES, props.size, oneOf(SIZES, group && group.size, "md"));
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;   // a group's invalid is on the group
  let mixed = !!props.indeterminate;
  const key = props.value == null ? "" : String(props.value);
  const all = !!(group && props.selectAll);
  const counted = !!group && !all && key !== "";
  const boxDisabled = !!(rest.disabled || (group && group.disabled));
  useIsoLayoutEffect(function () { return counted && group ? group.register(props.value as string | number, boxDisabled) : undefined; }, [counted, key, boxDisabled]);
  if (group) {
    const ownChange = rest.onChange;
    delete rest.defaultChecked;
    if (group.disabled) rest.disabled = true;
    if (all) {
      // Checked when every enabled box is, indeterminate when some are; a click checks them all, or clears them when all are.
      const enabled = [...group.boxes].filter(([, dis]) => !dis).map(([k]) => k), on = enabled.filter((k) => group.values.includes(k)).length;
      rest.checked = enabled.length > 0 && on === enabled.length;
      mixed = on > 0 && on < enabled.length;
      if (!enabled.length) rest.disabled = true;
      delete rest.name;
      rest.onChange = function (e: React.ChangeEvent<HTMLInputElement>) { if (ownChange) ownChange(e); group.toggleAll(on < enabled.length, e); };
    } else {
      rest.name = group.name;
      rest.checked = group.values.includes(key);
      rest.onChange = function (e: React.ChangeEvent<HTMLInputElement>) { if (ownChange) ownChange(e); group.toggle(key, e.currentTarget.checked, e); };
      // Required means at least one: every box is required while none is checked, so the browser asks for one.
      if (group.required && !group.values.some((v) => group.boxes.has(v))) rest.required = true;
    }
  }
  // Read-only: the native readonly does nothing on a checkbox, so a click (Space clicks too) is cancelled, which
  // puts the box back, and aria-readonly says why. Your onClick still runs first; onChange doesn't, since nothing changes.
  const readOnly = !!rest.readOnly;
  if (readOnly) {
    rest["aria-readonly"] = true;
    delete rest.onChange;
    const onClick = rest.onClick;
    rest.onClick = (e) => { if (onClick) onClick(e); e.preventDefault(); };
  }
  const own = React.useRef<HTMLInputElement | null>(null);
  const setRefs = React.useCallback(function (node: HTMLInputElement | null) {
    own.current = node;
    setRef(ref, node);
  }, [ref]);
  useIsoLayoutEffect(function () { if (own.current) own.current.indeterminate = mixed; });   // every render: a click clears it natively
  const base = domId("dk-cb", React.useId()), labelId = base + "-label", descId = base + "-desc";
  const hasLabel = props.children != null && props.children !== false && props.children !== "";
  const hasDesc = props.description != null && props.description !== false && props.description !== "";
  if (hasDesc) rest["aria-describedby"] = cn(rest["aria-describedby"], descId);
  // the description sits inside the <label> (so it's clickable too); naming by the label text alone keeps it out of the name
  if (hasDesc && hasLabel && rest["aria-label"] == null && rest["aria-labelledby"] == null) rest["aria-labelledby"] = labelId;
  return (
    <label className={cn("dk-checkbox", "dk-checkbox--size-" + size, (invalid || (group && group.invalid)) && "dk-checkbox--invalid", rest.disabled && "dk-checkbox--disabled", readOnly && "dk-checkbox--readonly", !hasLabel && !hasDesc && "dk-checkbox--bare", props.className)} style={props.style} data-component="checkbox" data-size={size}>
      <span className="dk-checkbox__control" key="control">
        <input {...rest} ref={setRefs} type="checkbox" className="dk-checkbox__input" key="input" />
        <span className="dk-checkbox__icon" aria-hidden key="icon"><Icon icon={mixed ? icons.Remove : icons.Check} /></span>
      </span>
      {hasLabel || hasDesc ? <span className="dk-checkbox__text" key="text">
        {hasLabel ? <span className="dk-checkbox__label" id={labelId} key="label">{props.children}</span> : null}
        {hasDesc ? <span className="dk-checkbox__description" id={descId} key="desc">{props.description}</span> : null}
      </span> : null}
    </label>
  );
});
