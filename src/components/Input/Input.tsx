"use client";
import * as React from "react";
import { useValidityMessages } from "../../internal/validity";
import { cn, domId, isInvalid, omit, oneOf, setRef, SIZES } from "../../internal/cn";
import type { IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { activeIn } from "../../internal/root";
import { useFieldControl } from "../../internal/field";
import { displayNumber } from "../../internal/numbers";
import { useLocale } from "../../internal/provider";
import { useTextLimit } from "../../internal/textLimit";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { pressFocuses, useAffixes } from "../../internal/affix";
import { applyMask, digitsOnly, isPlain, parseMask, unmask } from "../../internal/mask";
import { isComposing } from "../../internal/ime";

const PLAIN = { useGrouping: false } as const;
// Fields whose text isn't words: the phone keyboard shouldn't capitalize, correct or underline it.
const VERBATIM = /^(email|url)$/;
const VERBATIM_AUTOCOMPLETE = /\b(username|email|url|one-time-code)\b/;

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'children' | 'prefix'> {
  /** 'sm' (24px, text-xs), 'md' (32px, text-sm, default) or 'lg' (44px, text-base): the control heights, like Button. */
  size?: 'sm' | 'md' | 'lg';
  /** A danger border and focus ring, and aria-invalid. Say what's wrong in text next to it, linked with aria-describedby. */
  invalid?: boolean;
  /** A decorative icon inside the field, before the text: an icon name or an element. */
  leftIcon?: IconSource;
  /** A decorative icon inside the field, after the text. */
  rightIcon?: IconSource;
  /** Text inside the field, before what's typed, such as "https://" or "@". It's added to the field's description, so it's heard too. */
  prefix?: React.ReactNode;
  /** Text inside the field, after what's typed, such as "kg" or ".com". It's added to the field's description too. */
  suffix?: React.ReactNode;
  /** A character count at the end of the field, "12 / 50" with maxLength (text-colored once it's reached), read out
      only when few characters are left and at the limit. Linked to the field with aria-describedby. Default: false. */
  showCount?: boolean;
  /** Keeps the text in a pattern as people type, paste or delete, with the caret where they left it: 9 takes a digit,
      a a letter, A a letter in capitals, * a letter or digit; \ makes the next character plain; the rest shows as it is
      ("9999 9999 9999 9999", "99/99/9999", "AA99 **** **** ****"). value, defaultValue and onChange's
      event.target.value are the masked text. A digits-only mask gets the number keyboard on phones. */
  mask?: string;
}

/* mask: the value shown in the pattern, and each edit put back into it with the caret after the same character it
   was after (so typing in the middle, pasting or deleting doesn't throw it to the end). Backspace or Delete next to the
   pattern's own text (a space, a /) removes the typed character beyond it, not the text the pattern puts back. */
function useMask<P extends InputProps>(input: P, mask: string | undefined): P {
  const slots = React.useMemo(() => (mask ? parseMask(mask) : null), [mask]);
  if (!slots) return input;
  const rest: P = { ...input };   // a copy with the masked value and handlers, returned
  const show = (v: unknown) => applyMask(slots, unmask(slots, String(v))).text;
  if (rest.value != null && !Array.isArray(rest.value)) rest.value = show(rest.value);
  if (rest.defaultValue != null && !Array.isArray(rest.defaultValue)) rest.defaultValue = show(rest.defaultValue);
  if (rest.inputMode === undefined && digitsOnly(slots)) rest.inputMode = "numeric";
  const change = rest.onChange, key = rest.onKeyDown;
  rest.onChange = function (e) {
    const el = e.target, v = el.value, at = el.selectionStart != null ? el.selectionStart : v.length;
    const typed = unmask(slots, v), { text, ends } = applyMask(slots, typed);
    if (text !== v) {
      const n = Math.min(unmask(slots, v.slice(0, at)).length, ends.length);
      el.value = text;
      if (activeIn(el) === el) el.setSelectionRange(n ? ends[n - 1] : 0, n ? ends[n - 1] : 0);
    }
    if (change) change(e);
  };
  rest.onKeyDown = function (e) {
    // Yours runs first, so preventing Backspace or Delete there stops the caret skip too; and the skip waits while
    // an input method is composing, whose Backspace edits the composition (L8E31).
    if (key) key(e);
    const el = e.currentTarget, at = el.selectionStart;
    if (!e.defaultPrevented && !isComposing(e) && (e.key === "Backspace" || e.key === "Delete") && at != null && at === el.selectionEnd) {
      const back = e.key === "Backspace";
      let p = at;
      while (back ? p > 0 && isPlain(slots, el.value, p - 1) : p < el.value.length && isPlain(slots, el.value, p)) p += back ? -1 : 1;
      if (p !== at && (back ? p > 0 : p < el.value.length)) el.setSelectionRange(p, p);
    }
  };
  return rest;
}

/* Input: a single-line text field. size "sm", "md" (default) or "lg" (24, 32, 44px: the control heights, like
   Button); invalid (a danger border and aria-invalid); leftIcon / rightIcon (decorative, inside the field); prefix / suffix (text inside the field, heard as its description);
   showCount (a character count at the end, "12 / 50" with maxLength); maxLength (in characters as people see them,
   applied by Input). Email, URL, username and one-time-code fields get autocapitalize, autocorrect and spellcheck off.
   Renders <span class="dk-input"> around a native <input>: className and style go to the wrapper, every other
   prop (type, value, onChange, placeholder, disabled, readOnly, aria-*…) and ref to the <input>. */
/** A single-line text field: a native <input> (ref, value, onChange and every input attribute go to it) in a box that holds the icons; className and style go to the box. Label it with <label htmlFor> or aria-label. */
export const Input = /* @__PURE__ */ component<HTMLInputElement, InputProps>("Input", function Input(props, ref) {
  const nameRef = useNameCheck("Input", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  let rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, rightIcon: 1, prefix: 1, suffix: 1, showCount: 1, mask: 1, className: 1, style: 1 } as const);
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
  rest = useMask(rest, props.mask);
  const limited = useTextLimit(rest, own, { announce: !!props.showCount }), { length, max } = limited;
  rest = useValidityMessages(limited.props, own);   // the browser's message for a failed constraint, in the provider's words
  const countId = domId("dk-in", React.useId());
  const locale = useLocale();
  const num = (n: number) => displayNumber(n, locale, PLAIN);   // the locale's digits, as Textarea's
  const setRefs = React.useCallback(function (node: HTMLInputElement | null) {
    own.current = node;
    nameRef(node);
    setRef(ref, node);
  }, [ref, nameRef]);
  const affix = useAffixes(props.prefix, props.suffix, countId, own);
  if (affix.ids || props.showCount) rest["aria-describedby"] = cn(rest["aria-describedby"], affix.ids, props.showCount && countId);
  const icon = function (source: IconSource, side: string) {
    const node = asIcon(source);
    return node == null || node === false ? null : <span className={"dk-input__icon dk-input__icon--" + side} aria-hidden key={side}>{node}</span>;
  };
  return (
    <span className={cn("dk-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)} style={props.style} data-component="input" data-size={size} onMouseDown={pressFocuses(own)}>
      {icon(props.leftIcon, "left")}
      {affix.prefix}
      <input {...rest} ref={setRefs} className="dk-input__field" key="field" />
      {affix.suffix}
      {props.showCount ? <span className={cn("dk-input__count", max != null && length >= max && "dk-input__count--full")} id={countId} key="count">{max != null ? num(length) + " / " + num(max) : num(length)}</span> : null}
      {icon(props.rightIcon, "right")}
    </span>
  );
});
