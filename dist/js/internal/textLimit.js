// src/internal/textLimit.ts
import * as React from "react";
import { announce } from "./announce.js";
import { graphemeCount, limitEdit } from "./graphemes.js";
import { useSerupa } from "./provider.js";
import { useFormReset } from "./useFormReset.js";
var never = () => () => {
};
var yes = () => true;
var no = () => false;
function useTextLimit(rest, field, opts) {
  const labels = useSerupa().labels;
  const controlled = rest.value != null;
  const initial = String(controlled ? rest.value : rest.defaultValue != null ? rest.defaultValue : "");
  const [len, setLen] = React.useState(function() {
    return graphemeCount(initial);
  });
  const length = controlled ? graphemeCount(String(rest.value)) : len;
  const max = rest.maxLength != null && rest.maxLength > 0 ? rest.maxLength : null;
  const hydrated = React.useSyncExternalStore(never, yes, no);
  if (hydrated || max == null) delete rest.maxLength;
  const last = React.useRef(initial);
  const composing = React.useRef(false);
  if (controlled && !composing.current) last.current = String(rest.value);
  const defaultText = String(rest.defaultValue != null ? rest.defaultValue : "");
  useFormReset(field, function() {
    if (controlled) return;
    last.current = defaultText;
    setLen(graphemeCount(defaultText));
  });
  const near = max == null ? 0 : Math.max(1, Math.min(10, Math.round(max / 5)));
  const tell = function(before, after) {
    if (!opts.announce || max == null || after === before) return;
    const left = max - after, was = max - before;
    if (left <= near && was > near || left === 0 && was > 0) announce(labels.charactersLeft(left));
  };
  const limit = function(el) {
    const cut = max != null && !composing.current ? limitEdit(last.current, el.value, max) : null;
    if (cut) {
      el.value = cut.value;
      el.setSelectionRange(cut.caret, cut.caret);
    }
    return !!cut;
  };
  const onChange = rest.onChange;
  rest.onChange = function(e) {
    limit(e.target);
    if (!composing.current) {
      tell(graphemeCount(last.current), graphemeCount(e.target.value));
      last.current = e.target.value;
    }
    if (!controlled) setLen(graphemeCount(e.target.value));
    if (onChange) onChange(e);
  };
  const onCompositionStart = rest.onCompositionStart, onCompositionEnd = rest.onCompositionEnd;
  rest.onCompositionStart = function(e) {
    composing.current = true;
    if (onCompositionStart) onCompositionStart(e);
  };
  rest.onCompositionEnd = function(e) {
    composing.current = false;
    const el = e.currentTarget, before = el.value;
    if (limit(el)) {
      const cut = el.value;
      el.value = before;
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set.call(el, cut);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      tell(graphemeCount(last.current), graphemeCount(el.value));
      last.current = el.value;
    }
    if (onCompositionEnd) onCompositionEnd(e);
  };
  return { length, max };
}
export {
  useTextLimit
};
//# sourceMappingURL=textLimit.js.map
