// src/internal/validity.ts
import * as React from "react";
import { useSettings } from "./provider.js";
import { en as inputWords } from "../components/Input/labels.js";
var REASONS = ["valueMissing", "typeMismatch", "badInput", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "stepMismatch", "patternMismatch"];
function useValidityMessages(props, own) {
  const rest = { ...props };
  const say = useSettings(inputWords).labels.invalidValue;
  const ours = React.useRef(false);
  const clear = (el) => {
    if (el && ours.current) {
      ours.current = false;
      el.setCustomValidity("");
    }
  };
  const invalid = rest.onInvalid, input = rest.onInput;
  rest.onInvalid = function(e) {
    if (invalid) invalid(e);
    const el = e.currentTarget;
    clear(el);
    if (e.defaultPrevented || el.validity.customError) return;
    const reason = REASONS.find((r) => el.validity[r]);
    if (!reason) return;
    const text = say({
      reason,
      type: el instanceof HTMLTextAreaElement ? "textarea" : el.type,
      length: el.value.length,
      minLength: el.minLength >= 0 ? el.minLength : void 0,
      maxLength: el.maxLength >= 0 ? el.maxLength : void 0,
      min: attr(el, "min"),
      max: attr(el, "max"),
      step: attr(el, "step"),
      title: el.title
    });
    if (text) {
      el.setCustomValidity(text);
      ours.current = true;
    }
  };
  rest.onInput = function(e) {
    clear(e.currentTarget);
    if (input) input(e);
  };
  const value = rest.value;
  React.useEffect(() => {
    const el = own.current;
    if (el && ours.current) {
      ours.current = false;
      el.setCustomValidity("");
    }
  }, [value, own]);
  return rest;
}
var attr = (el, name) => el.getAttribute(name) || void 0;
export {
  useValidityMessages
};
//# sourceMappingURL=validity.js.map
