"use client";
import * as React from "react";
import { cn, isInvalid, omit, oneOf } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";

export interface PasswordInputProps extends Omit<InputProps, "type" | "showCount" | "rightIcon"> {
  /** Shows the password as text (controlled). Use with onVisibleChange. */
  visible?: boolean;
  /** Shows it as text at first (uncontrolled). Default: false. */
  defaultVisible?: boolean;
  /** Called with the new state when the show/hide button is pressed. */
  onVisibleChange?: (visible: boolean) => void;
  /** The show/hide button's name. Default: "Show password" (its aria-pressed says whether it's shown). */
  toggleLabel?: string;
}

const SIZES = ["sm", "md", "lg"] as const;

/* PasswordInput: an Input for passwords with a button at the end that shows and hides what was typed. It uses
   Input's box and tokens. autoComplete defaults to "current-password"; use "new-password" on sign-up forms.
   className and style go to the box; ref and every other prop to the <input>. */
/** A password field with a button that shows and hides what was typed. */
export const PasswordInput = /* @__PURE__ */ component<HTMLInputElement, PasswordInputProps>("PasswordInput", function PasswordInput(props, ref) {
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSerupa();
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, className: 1, style: 1, visible: 1, defaultVisible: 1, onVisibleChange: 1, toggleLabel: 1 } as const);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  if (rest.autoComplete === undefined) rest.autoComplete = "current-password";
  const [own2, setOwn] = React.useState(!!props.defaultVisible);
  const controlled = props.visible !== undefined;
  const shown = controlled ? !!props.visible : own2;
  const left = asIcon(props.leftIcon);
  const toggle = () => {
    if (!controlled) setOwn(!shown);
    if (props.onVisibleChange) props.onVisibleChange(!shown);
  };
  return (
    <span className={cn("dk-input dk-password-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)}
      style={props.style} data-component="password-input" data-size={size}>
      {left != null && left !== false ? <span className="dk-input__icon dk-input__icon--left" aria-hidden>{left}</span> : null}
      <input {...rest} ref={ref} type={shown ? "text" : "password"} className="dk-input__field" spellCheck={false} autoCapitalize="off" />
      <button type="button" className="dk-password-input__toggle" aria-label={props.toggleLabel || sds.labels.showPassword} aria-pressed={shown}
        aria-controls={rest.id} disabled={rest.disabled} onClick={toggle} onMouseDown={(e) => e.preventDefault()}>
        <Icon icon={shown ? icons.VisibilityOff : icons.Visibility} />
      </button>
    </span>
  );
});
