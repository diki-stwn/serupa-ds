"use client";
import * as React from "react";
import { cn, domId, isInvalid, oneOf, omit, SIZES } from "../../internal/cn";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { warnOnce } from "../../internal/warn";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'role'> {
  /** 'sm' (28 by 16px track, text-xs), 'md' (36 by 20px, text-sm, default) or 'lg' (44 by 24px, text-base). */
  size?: 'sm' | 'md' | 'lg';
  /** The label; a click on it flips the switch. Without one, give the switch an aria-label. */
  children?: React.ReactNode;
  /** A second, muted line under the label, linked to the switch with aria-describedby. */
  description?: React.ReactNode;
  /** 'end' (the label after the track, default) or 'start' (the label first, as in a settings list). */
  labelPosition?: 'start' | 'end';
  /** A danger track (while off) and focus ring, and aria-invalid. */
  invalid?: boolean;
  /** Focusable and read out (aria-readonly), but a click or Space doesn't flip it; an on switch is still submitted. */
  readOnly?: boolean;
  /** While a change is being saved: a small Loader turns on the thumb, aria-busy is set, and clicks and Space don't flip it, so it can't be sent twice. It stays focusable. Set checked when the save succeeds. */
  pending?: boolean;
  /** Called with the new state and the change event, after onChange: the same shape as ToggleButton's onPressedChange. */
  onCheckedChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}

/* Switch: an on/off setting that applies at once. A native checkbox with role="switch" (announced as on or off),
   drawn as a track and thumb. size "sm", "md" (default) or "lg"; children (the label); description;
   labelPosition "end" (default) or "start"; invalid. Renders <label class="dk-switch">: className and style go
   to the label, every other prop (checked, defaultChecked, onChange, name, disabled, aria-*…) and ref to the
   <input>. */
const OWN = { size: 1, invalid: 1, pending: 1, onCheckedChange: 1, description: 1, labelPosition: 1, children: 1, className: 1, style: 1, type: 1, role: 1 } as const;

/** An on/off setting that applies at once: a native checkbox with role="switch" (ref, checked, onChange and every input attribute go to it), drawn as a track and thumb; className and style go to the <label> around it. */
export const Switch = /* @__PURE__ */ component<HTMLInputElement, SwitchProps>("Switch", function Switch(props, ref) {
  const nameRef = useNameCheck("Switch", NAME_HOW.label, ref);   // warns when it has no accessible name
  if (process.env.NODE_ENV !== "production" && (props as { label?: unknown }).label != null) warnOnce("label-prop", "Switch: label isn't one of its props, so it lands on the <input> as an attribute and names nothing. Put the text in children.", "label-prop:Switch");
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const rest = omit(props, OWN);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const checkedChange = props.onCheckedChange;
  if (checkedChange) {
    const before = rest.onChange;
    rest.onChange = function (e: React.ChangeEvent<HTMLInputElement>) { if (before) before(e); checkedChange(e.currentTarget.checked, e); };
  }
  // Read-only: the native readonly does nothing on a checkbox, so a click (Space clicks too) is cancelled, which
  // puts the switch back, and aria-readonly says why. Your onClick still runs first; onChange doesn't, since nothing changes.
  // Pending blocks a flip the same way, with aria-busy instead: it isn't read-only, it's waiting.
  const readOnly = !!rest.readOnly, pending = !!props.pending;
  if (pending) rest["aria-busy"] = true;
  if (readOnly || pending) {
    if (readOnly) rest["aria-readonly"] = true;
    delete rest.onChange;
    const onClick = rest.onClick;
    rest.onClick = (e) => { if (onClick) onClick(e); e.preventDefault(); };
  }
  const base = domId("dk-sw", React.useId()), labelId = base + "-label", descId = base + "-desc";
  const hasLabel = props.children != null && props.children !== false && props.children !== "";
  const hasDesc = props.description != null && props.description !== false && props.description !== "";
  if (hasDesc) rest["aria-describedby"] = cn(rest["aria-describedby"], descId);
  if (hasDesc && hasLabel && rest["aria-label"] == null && rest["aria-labelledby"] == null) rest["aria-labelledby"] = labelId;   // the description stays out of the name
  return (
    <label className={cn("dk-switch", "dk-switch--size-" + size, props.labelPosition === "start" && "dk-switch--label-start", invalid && "dk-switch--invalid", rest.disabled && "dk-switch--disabled", readOnly && "dk-switch--readonly", pending && "dk-switch--pending", !hasLabel && !hasDesc && "dk-switch--bare", props.className)} style={props.style} data-component="switch" data-size={size} data-pending={pending ? "" : undefined}>
      <span className="dk-switch__control" key="control">
        <input {...rest} ref={nameRef} type="checkbox" role="switch" className="dk-switch__input" key="input" />
        <span className="dk-switch__thumb" aria-hidden key="thumb">{pending ? <span className="dk-switch__spinner" key="spin" /> : null}</span>
      </span>
      {hasLabel || hasDesc ? <span className="dk-switch__text" key="text">
        {hasLabel ? <span className="dk-switch__label" id={labelId} key="label">{props.children}</span> : null}
        {hasDesc ? <span className="dk-switch__description" id={descId} key="desc">{props.description}</span> : null}
      </span> : null}
    </label>
  );
});
