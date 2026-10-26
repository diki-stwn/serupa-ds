import * as React from "react";
import type { ValidityProblem } from "../components/Input/labels";
import { useSettings } from "./provider";
import { en as inputWords } from "../components/Input/labels";

type Field = HTMLInputElement | HTMLTextAreaElement;
const REASONS: ValidityProblem["reason"][] = ["valueMissing", "typeMismatch", "badInput", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "patternMismatch"];

/* The browser's message for a failed native constraint, in the provider's words (invalidValue, 216). It's set in
   the invalid event, which fires just before the browser shows the message, and only when nothing else set a
   custom one; it's cleared on the next input, or when a controlled value changes, so the field is judged by its
   constraints again. `ours` marks a field holding our message rather than the product's own setCustomValidity. */
export function useValidityMessages<P extends { onInvalid?: React.FormEventHandler<E>; onInput?: React.FormEventHandler<E>; value?: unknown }, E extends Field>(rest: P, own: React.RefObject<E | null>): void {
  const say = useSettings(inputWords).labels.invalidValue;
  const ours = React.useRef(false);
  const clear = (el: E | null) => { if (el && ours.current) { ours.current = false; el.setCustomValidity(""); } };
  const invalid = rest.onInvalid, input = rest.onInput;
  rest.onInvalid = function (e) {
    if (invalid) invalid(e);
    const el = e.currentTarget;
    clear(el);
    if (e.defaultPrevented || el.validity.customError) return;
    const reason = REASONS.find((r) => el.validity[r]);
    if (!reason) return;
    const text = say({ reason, type: el instanceof HTMLTextAreaElement ? "textarea" : el.type, length: el.value.length,
      minLength: el.minLength >= 0 ? el.minLength : undefined, maxLength: el.maxLength >= 0 ? el.maxLength : undefined,
      min: attr(el, "min"), max: attr(el, "max"), step: attr(el, "step"), title: el.title });
    if (text) { el.setCustomValidity(text); ours.current = true; }
  };
  rest.onInput = function (e) { clear(e.currentTarget); if (input) input(e); };
  const value = rest.value;
  React.useEffect(() => {
    const el = own.current;
    if (el && ours.current) { ours.current = false; el.setCustomValidity(""); }
  }, [value, own]);
}
const attr = (el: Field, name: string) => el.getAttribute(name) || undefined;
