"use client";
import * as React from "react";
import { cn, domId, isInvalid, omit, oneOf, setRef, SIZES } from "../../internal/cn";
import { type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { displayNumber } from "../../internal/numbers";
import { useLocale } from "../../internal/provider";
import { useTextLimit } from "../../internal/textLimit";

const PLAIN = { useGrouping: false } as const;
// Fields whose text isn't words: the phone keyboard shouldn't capitalize, correct or underline it.
const VERBATIM = /^(email|url)$/;
const VERBATIM_AUTOCOMPLETE = /\b(username|email|url|one-time-code)\b/;

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'children'> {
  /** 'sm' (24px, text-xs), 'md' (32px, text-sm, default) or 'lg' (44px, text-base): the control heights, like Button. */
  size?: 'sm' | 'md' | 'lg';
  /** A danger border and focus ring, and aria-invalid. Say what's wrong in text next to it, linked with aria-describedby. */
  invalid?: boolean;
  /** A decorative icon inside the field, before the text: an icon name or an element. */
  leftIcon?: IconSource;
  /** A decorative icon inside the field, after the text. */
  rightIcon?: IconSource;
  /** A character count at the end of the field, "12 / 50" with maxLength (text-colored once it's reached), read out
      only when few characters are left and at the limit. Linked to the field with aria-describedby. Default: false. */
  showCount?: boolean;
}

/* Input: a single-line text field. size "sm", "md" (default) or "lg" (24, 32, 44px: the control heights, like
   Button); invalid (a danger border and aria-invalid); leftIcon / rightIcon (decorative, inside the field);
   showCount (a character count at the end, "12 / 50" with maxLength); maxLength (in characters as people see them,
   applied by Input). Email, URL, username and one-time-code fields get autocapitalize, autocorrect and spellcheck off.
   Renders <span class="dk-input"> around a native <input>: className and style go to the wrapper, every other
   prop (type, value, onChange, placeholder, disabled, readOnly, aria-*…) and ref to the <input>. */
/** A single-line text field: a native <input> (ref, value, onChange and every input attribute go to it) in a box that holds the icons; className and style go to the box. Label it with <label htmlFor> or aria-label. */
export const Input = /* @__PURE__ */ component<HTMLInputElement, InputProps>("Input", function Input(props, ref) {
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, rightIcon: 1, showCount: 1, className: 1, style: 1 } as const);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  if (rest.type === undefined) rest.type = "text";
  if (VERBATIM.test(rest.type) || VERBATIM_AUTOCOMPLETE.test(rest.autoComplete || "")) {
    if (rest.autoCapitalize === undefined) rest.autoCapitalize = "off";
    if (rest.autoCorrect === undefined) rest.autoCorrect = "off";
    if (rest.spellCheck === undefined) rest.spellCheck = false;
  }
  const own = React.useRef<HTMLInputElement | null>(null);
  const { length, max } = useTextLimit(rest, own, { announce: !!props.showCount });
  const countId = domId("dk-in", React.useId());
  const locale = useLocale();
  const num = (n: number) => displayNumber(n, locale, PLAIN);   // the locale's digits, as Textarea's
  const setRefs = React.useCallback(function (node: HTMLInputElement | null) {
    own.current = node;
    setRef(ref, node);
  }, [ref]);
  if (props.showCount) rest["aria-describedby"] = cn(rest["aria-describedby"], countId);
  const icon = function (source: IconSource, side: string) {
    const node = asIcon(source);
    return node == null || node === false ? null : <span className={"dk-input__icon dk-input__icon--" + side} aria-hidden key={side}>{node}</span>;
  };
  return (
    <span className={cn("dk-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)} style={props.style} data-component="input" data-size={size}>
      {icon(props.leftIcon, "left")}
      <input {...rest} ref={setRefs} className="dk-input__field" key="field" />
      {props.showCount ? <span className={cn("dk-input__count", max != null && length >= max && "dk-input__count--full")} id={countId} key="count">{max != null ? num(length) + " / " + num(max) : num(length)}</span> : null}
      {icon(props.rightIcon, "right")}
    </span>
  );
});
