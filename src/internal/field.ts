"use client";
import * as React from "react";

/* What a Field hands the control inside it, at any depth: wrapped in a Tooltip, your own <EmailInput> or a form
   library's Controller, the control still gets the label's id, the hint and error, required, invalid and
   disabled. (Field also passes them to a direct child with cloneElement, for plain DOM controls.) A group Field
   (a fieldset) hands nothing: its controls each have their own label. */
export interface FieldControl {
  id: string;
  labelId?: string;
  describedBy?: string;
  /** The error message's id while the control is invalid, for aria-errormessage. */
  errorMessage?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}
export const FieldContext = /* @__PURE__ */ React.createContext<FieldControl | null>(null);

type ControlProps = { id?: string; invalid?: boolean; disabled?: boolean; "aria-describedby"?: string; "aria-errormessage"?: string; "aria-required"?: React.AriaAttributes["aria-required"] };

/** A control's props with the surrounding Field's filled in; its own props win. Ids in aria-describedby aren't repeated. */
export function useFieldControl<P extends ControlProps>(props: P): P {
  const f = React.useContext(FieldContext);
  if (!f) return props;
  const ids = [...new Set([props["aria-describedby"], f.describedBy].join(" ").split(/\s+/).filter(Boolean))].join(" ");
  return {
    ...props,
    id: props.id || f.id,
    "aria-describedby": ids || undefined,
    "aria-errormessage": props["aria-errormessage"] ?? f.errorMessage,
    "aria-required": props["aria-required"] ?? (f.required || undefined),
    invalid: props.invalid || f.invalid || undefined,
    disabled: props.disabled ?? (f.disabled || undefined),
  };
}
