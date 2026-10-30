"use client";
import * as React from "react";
import { cn, isInvalid, omit, oneOf, setRef, SIZES } from "../../internal/cn";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { useFormReset } from "../../internal/useFormReset";
import { latinDigits } from "../../internal/digits";

export interface PinInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'maxLength' | 'children'> {
  /** How many characters the code has, one box each. Default: 6. */
  length?: number;
  /** The code typed so far (controlled). */
  value?: string;
  /** The code at first (uncontrolled). */
  defaultValue?: string;
  /** Called with the code as it changes, after characters that don't fit `type` are dropped. */
  onValueChange?: (value: string) => void;
  /** Called with the code once every box is filled, by typing, pasting or a one-time code the phone offers. */
  onComplete?: (value: string) => void;
  /** 'numeric' (digits only and a number keypad, default) or 'alphanumeric' (letters and digits). */
  type?: 'numeric' | 'alphanumeric';
  /** Shows a dot in each filled box instead of the character, and makes the field a password field. Default: false. */
  mask?: boolean;
  /** 'sm', 'md' (default) or 'lg': square boxes at the control heights, 24, 32 and 44px. */
  size?: 'sm' | 'md' | 'lg';
  /** A danger border on every box, and aria-invalid. Say what's wrong in text next to it; Field's error does both. */
  invalid?: boolean;
}

const KEEP = { numeric: /[^0-9]/g, alphanumeric: /[^0-9A-Za-z]/g } as const;

/* PinInput: a one-time code or PIN, drawn as one box per character but typed into one native <input> that lies
   over the boxes, unseen. So it's one field to a screen reader, a label, a form and a password manager:
   autocomplete="one-time-code" lets a phone fill a texted code, a paste fills every box (spaces and dashes
   dropped), Backspace takes the last character. The caret stays at the end, and the box it's in gets the focus
   ring. The code reads left to right, also in a right-to-left page. Every prop but className and style, and ref,
   go to the <input>; its value is what the form submits. */
/** A one-time code or PIN in one box per character, typed into one native field: paste, autofill and forms work as with an Input. */
export const PinInput = /* @__PURE__ */ component<HTMLInputElement, PinInputProps>("PinInput", function PinInput(props, ref) {
  const nameRef = useNameCheck("PinInput", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);
  const rest = omit(props, { length: 1, value: 1, defaultValue: 1, onValueChange: 1, onComplete: 1, type: 1, mask: 1, size: 1, invalid: 1, className: 1, style: 1 } as const);
  const length = Math.max(1, Math.floor(props.length || 6));
  const type = oneOf(["numeric", "alphanumeric"] as const, props.type, "numeric");
  const size = oneOf(SIZES, props.size, "md");
  // Digits in any script read as ASCII, and full-width letters as the usual ones: an Arabic or Persian keyboard types
  // ٤٥٦, a Japanese IME ４５６ or ＡＢ, and a code read off the screen is the same code (GR42).
  const clean = (s: string | undefined) => latinDigits((s || "").normalize("NFKC")).replace(KEEP[type], "").slice(0, length);
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState(() => clean(props.defaultValue));
  const code = controlled ? clean(props.value) : own;
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const input = React.useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = React.useState(false);
  useFormReset(input, function () { if (!controlled) setOwn(clean(props.defaultValue)); });

  // The caret always sits after the last character, so typing adds to the end and Backspace takes the last one:
  // the arrows, Home and End don't move it, and a click or a selection puts it back.
  const toEnd = function (e: { currentTarget: HTMLInputElement }) {
    const el = e.currentTarget, n = el.value.length, s = el.selectionStart, end = el.selectionEnd;
    // Everything selected (Ctrl+A, or a paste that replaces the code) stays selected, so what comes next replaces it.
    if ((s !== n || end !== n) && !(s === 0 && end === n)) { try { el.setSelectionRange(n, n); } catch { /* not a text field */ } }
  };
  const onChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    const next = clean(e.currentTarget.value);
    if (next === code) { e.currentTarget.value = code; return; }
    if (!controlled) setOwn(next);
    if (props.onValueChange) props.onValueChange(next);
    if (next.length === length && props.onComplete) props.onComplete(next);
  };
  const active = Math.min(code.length, length - 1);
  const boxes: React.ReactNode[] = [];
  for (let i = 0; i < length; i++) {
    const ch = code.charAt(i);
    boxes.push(<span key={i} className={cn("dk-pin-input__box", ch && "dk-pin-input__box--filled", focused && i === active && "dk-pin-input__box--active", focused && i === active && !ch && "dk-pin-input__box--caret")}>
      {ch ? (props.mask ? "•" : ch) : null}
    </span>);
  }
  return (
    <span className={cn("dk-pin-input", "dk-pin-input--size-" + size, invalid && "dk-pin-input--invalid", rest.disabled && "dk-pin-input--disabled", rest.readOnly && "dk-pin-input--readonly", props.className)}
      style={props.style} data-component="pin-input" data-size={size}>
      <span className="dk-pin-input__boxes" aria-hidden>{boxes}</span>
      <input autoComplete="one-time-code" pattern={type === "numeric" ? "[0-9]{" + length + "}" : "[0-9A-Za-z]{" + length + "}"}
        inputMode={type === "numeric" ? "numeric" : "text"} autoCapitalize="off" autoCorrect="off" spellCheck={false} {...rest}
        type={props.mask ? "password" : "text"} value={code} onChange={onChange}
        onFocus={function (e) { setFocused(true); if (rest.onFocus) rest.onFocus(e); }}
        onBlur={function (e) { setFocused(false); if (rest.onBlur) rest.onBlur(e); }}
        onKeyDown={function (e) { if (rest.onKeyDown) rest.onKeyDown(e); if (e.defaultPrevented) return; if (/^(Arrow(Left|Right|Up|Down)|Home|End|PageUp|PageDown)$/.test(e.key)) e.preventDefault(); else toEnd(e); }}
        onSelect={function (e) { toEnd(e); if (rest.onSelect) rest.onSelect(e); }}
        ref={function (n) { input.current = n; nameRef(n); setRef(ref, n); }} className="dk-pin-input__field" />
    </span>
  );
});
