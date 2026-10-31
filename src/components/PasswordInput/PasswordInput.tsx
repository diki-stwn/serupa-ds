"use client";
import * as React from "react";
import { announce } from "../../internal/announce";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { cn, domId, isInvalid, omit, oneOf, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { pressFocuses } from "../../internal/affix";
import { useSettings } from "../../internal/provider";
import * as icons from "../../material/builtin";
import { en as words } from "./labels";

export interface PasswordInputProps extends Omit<InputProps, "type" | "showCount" | "prefix" | "suffix" | "rightIcon"> {
  /** Shows the password as text (controlled). Use with onVisibleChange. */
  visible?: boolean;
  /** Shows it as text at first (uncontrolled). Default: false. */
  defaultVisible?: boolean;
  /** Called with the new state when the show/hide button is pressed. */
  onVisibleChange?: (visible: boolean) => void;
  /** The show/hide button's name. Default: "Show password" (its aria-pressed says whether it's shown). */
  toggleLabel?: string;
  /** While Caps Lock is on and the field has focus, "Caps Lock is on" shows at the end of the field and is read out once. Default: true. */
  capsLockHint?: boolean;
}

const SIZES = ["sm", "md", "lg"] as const;

/* PasswordInput: an Input for passwords with a button at the end that shows and hides what was typed. It uses
   Input's box and tokens. autoComplete defaults to "current-password"; use "new-password" on sign-up forms.
   While Caps Lock is on, a "Caps Lock is on" hint shows in the field and is read out (capsLockHint={false} turns it
   off). Pasting is never blocked, so password managers and pasted passwords work (WCAG 3.3.8).
   className and style go to the box; ref and every other prop to the <input>. */
/** A password field with a button that shows and hides what was typed. */
export const PasswordInput = /* @__PURE__ */ component<HTMLInputElement, PasswordInputProps>("PasswordInput", function PasswordInput(props, ref) {
  const nameRef = useNameCheck("PasswordInput", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSettings(words);
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, className: 1, style: 1, visible: 1, defaultVisible: 1, onVisibleChange: 1, toggleLabel: 1, capsLockHint: 1 } as const);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  if (rest.autoComplete === undefined) rest.autoComplete = "current-password";
  const [own2, setOwn] = React.useState(!!props.defaultVisible);
  const controlled = props.visible !== undefined;
  const shown = controlled ? !!props.visible : own2;
  const left = asIcon(props.leftIcon);
  // Caps Lock, read from the key events while the field has focus (there's no event for the key itself).
  const [caps, setCaps] = React.useState(false);
  const capsId = domId("dk-pw-caps", React.useId());
  const hint = props.capsLockHint !== false;
  const sense = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hint || typeof e.getModifierState !== "function") return;
    const on = e.getModifierState("CapsLock");
    if (on !== caps) { setCaps(on); if (on) announce(sds.labels.capsLockOn); }
  };
  const onKeyDown = rest.onKeyDown, onKeyUp = rest.onKeyUp, onBlur = rest.onBlur;
  rest.onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { sense(e); if (onKeyDown) onKeyDown(e); };
  rest.onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => { sense(e); if (onKeyUp) onKeyUp(e); };
  rest.onBlur = (e: React.FocusEvent<HTMLInputElement>) => { setCaps(false); if (onBlur) onBlur(e); };
  if (caps) rest["aria-describedby"] = cn(rest["aria-describedby"], capsId);
  // Switching the type puts the caret at the start: keep where it was, so typing goes on where it stopped.
  const field = React.useRef<HTMLInputElement | null>(null);
  const caret = React.useRef<[number, number, "forward" | "backward" | "none", number, number] | null>(null);
  const fieldRef = React.useCallback((n: HTMLInputElement | null) => { field.current = n; nameRef(n); setRef(ref, n); }, [ref, nameRef]);
  useIsoLayoutEffect(() => {
    const f = field.current, c = caret.current;
    caret.current = null;
    if (!f || !c) return;
    // Chrome moves the caret once it has applied the new type, after this effect: put it back then too. The new type
    // also scrolls the field back to its start, so a long password's caret goes out of view: the caret is kept where it
    // was in the view, its place in the text scaled to the new width (at the end, the field scrolls to the end) (GI4).
    const put = () => {
      if (f.selectionStart === null) return;
      f.setSelectionRange(c[0], c[1], c[2]);
      const at = (c[2] === "backward" ? c[0] : c[1]) / Math.max(f.value.length, 1);
      f.scrollLeft = at * f.scrollWidth - (at * c[4] - c[3]);
    };
    put();
    const frame = requestAnimationFrame(put);
    return () => { cancelAnimationFrame(frame); };
  }, [shown]);
  // Read at the button's mousedown when there is one: WebKit collapses the field's selection to its end on the way to the
  // click, so a selection read there is already gone (BW1). A press that never became a click leaves a stale one: kept
  // only for a click within a second of it. The selection is also kept as it changes while the field has focus, and that
  // is what's read: WebKit can collapse a selection set by script (setSelectionRange) before the mousedown, unless it was
  // read when it changed.
  const pressed = React.useRef(0);
  const seen = React.useRef<[number, number, "forward" | "backward" | "none"] | null>(null);
  React.useEffect(() => {
    const keep = () => {
      const f = field.current;
      if (f && document.activeElement === f && f.selectionStart !== null && f.selectionEnd !== null) seen.current = [f.selectionStart, f.selectionEnd, f.selectionDirection || "none"];
    };
    document.addEventListener("selectionchange", keep, true);
    return () => document.removeEventListener("selectionchange", keep, true);
  }, []);
  const capture = () => {
    const f = field.current;
    if (!f || f.selectionStart === null || f.selectionEnd === null) return;
    const s = seen.current && document.activeElement === f ? seen.current : [f.selectionStart, f.selectionEnd, f.selectionDirection || "none"] as const;
    caret.current = [s[0], s[1], s[2], f.scrollLeft, f.scrollWidth];
  };
  const toggle = () => {
    if (!caret.current || performance.now() - pressed.current > 1000) capture();
    if (!controlled) setOwn(!shown);
    if (props.onVisibleChange) props.onVisibleChange(!shown);
  };
  return (
    <span className={cn("dk-input dk-password-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)}
      style={props.style} data-component="password-input" data-size={size} onMouseDown={pressFocuses(field)}>
      {left != null && left !== false ? <span className="dk-input__icon dk-input__icon--left" aria-hidden>{left}</span> : null}
      <input {...rest} ref={fieldRef} type={shown ? "text" : "password"} className="dk-input__field" spellCheck={false} autoCapitalize="off" />
      {caps ? <span className="dk-password-input__caps" id={capsId}>{sds.labels.capsLockOn}</span> : null}
      <button type="button" className="dk-password-input__toggle" aria-label={props.toggleLabel || sds.labels.showPassword} aria-pressed={shown}
        aria-controls={rest.id} disabled={rest.disabled} onClick={toggle} onMouseDown={(e) => { e.preventDefault(); capture(); pressed.current = performance.now(); }}>
        <Icon icon={shown ? icons.VisibilityOff : icons.Visibility} />
      </button>
    </span>
  );
});
