import * as React from "react";
import { announce } from "./announce";
import { graphemeCount, limitEdit } from "./graphemes";
import { useSettings } from "./provider";
import { useFormReset } from "./useFormReset";
import { en as inputWords } from "../components/Input/labels";

type Field = HTMLInputElement | HTMLTextAreaElement;
const never = () => () => {}, yes = () => true, no = () => false;
type Handlers<E extends Field> = {
  value?: string | number | readonly string[] | null; defaultValue?: string | number | readonly string[] | null; maxLength?: number;
  onChange?: React.ChangeEventHandler<E>;
  onCompositionStart?: React.CompositionEventHandler<E>;
  onCompositionEnd?: React.CompositionEventHandler<E>;
};

/* The character count and maxLength of Input and Textarea, in characters as people see them (👨‍👩‍👧 is one), not the
   browser's UTF-16 units. It takes maxLength off the native field once hydrated (the browser's would stop typing at
   "4 / 10" with emoji) and applies it itself, wrapping rest's change and composition handlers. With announce (showCount), the count
   is read out only near the limit, once when few characters are left and once when it's reached, not on every
   keystroke. A form reset puts the count back to the default's. */
export function useTextLimit<E extends Field>(rest: Handlers<E>, field: React.RefObject<E | null>, opts: { announce: boolean }): { length: number; max: number | null } {
  const labels = useSettings(inputWords).labels;
  const controlled = rest.value != null;
  const initial = String(controlled ? rest.value : rest.defaultValue != null ? rest.defaultValue : "");
  const [len, setLen] = React.useState(function () { return graphemeCount(initial); });
  const length = controlled ? graphemeCount(String(rest.value)) : len;
  const max = rest.maxLength != null && rest.maxLength > 0 ? rest.maxLength : null;
  // Server HTML and the hydration render keep the native maxLength, so the cap holds before the script runs or
  // without it; it comes off right after hydration. A client-only render never has it.
  const hydrated = React.useSyncExternalStore(never, yes, no);
  if (hydrated || max == null) delete rest.maxLength;
  const last = React.useRef(initial);
  const composing = React.useRef(false);
  if (controlled && !composing.current) last.current = String(rest.value);   // the value the parent holds now
  const defaultText = String(rest.defaultValue != null ? rest.defaultValue : "");
  useFormReset(field, function () {
    if (controlled) return;
    last.current = defaultText;
    setLen(graphemeCount(defaultText));
  });
  // Near the limit: 10 left, or a fifth of a short limit (1 of 7). Read out when an edit crosses it and at 0.
  const near = max == null ? 0 : Math.max(1, Math.min(10, Math.round(max / 5)));
  const tell = function (before: number, after: number) {
    if (!opts.announce || max == null || after === before) return;
    const left = max - after, was = max - before;
    if ((left <= near && was > near) || (left === 0 && was > 0)) announce(labels.charactersLeft(left));
  };
  /* Past maxLength, what was typed or pasted is cut to fit, as the browser cuts it; never in the middle of an input
     method's composition, which is cut once it's confirmed. */
  const limit = function (el: E) {
    const cut = max != null && !composing.current ? limitEdit(last.current, el.value, max) : null;
    if (cut) { el.value = cut.value; el.setSelectionRange(cut.caret, cut.caret); }
    return !!cut;
  };
  const onChange = rest.onChange;
  rest.onChange = function (e: React.ChangeEvent<E>) {
    limit(e.target);
    if (!composing.current) {   // mid-composition, the edit runs from before it began
      tell(graphemeCount(last.current), graphemeCount(e.target.value));
      last.current = e.target.value;
    }
    if (!controlled) setLen(graphemeCount(e.target.value));
    if (onChange) onChange(e);
  };
  const onCompositionStart = rest.onCompositionStart, onCompositionEnd = rest.onCompositionEnd;
  rest.onCompositionStart = function (e: React.CompositionEvent<E>) {
    composing.current = true;
    if (onCompositionStart) onCompositionStart(e);
  };
  rest.onCompositionEnd = function (e: React.CompositionEvent<E>) {
    composing.current = false;
    const el = e.currentTarget, before = el.value;
    // Confirmed text past the limit: cut it and tell onChange, through the input event React listens for.
    if (limit(el)) {
      const cut = el.value;
      el.value = before;
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!.call(el, cut);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      tell(graphemeCount(last.current), graphemeCount(el.value));
      last.current = el.value;
    }
    if (onCompositionEnd) onCompositionEnd(e);
  };
  return { length, max };
}
