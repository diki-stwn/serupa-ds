"use client";
import * as React from "react";
import { cn, isInvalid, omit, oneOf, SIZES } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { Loader } from "../Loader/Loader";
import type { InputProps } from "../Input/Input";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { isComposing } from "../../internal/ime";
import { useFormReset } from "../../internal/useFormReset";
import { useSerupa } from "../../internal/provider";
import * as icons from "../../material/builtin";

export interface SearchInputProps extends Omit<InputProps, "type" | "showCount" | "prefix" | "suffix" | "leftIcon" | "rightIcon"> {
  /** Called with the text when Enter is pressed. */
  onSearch?: (value: string) => void;
  /** Called after the field is cleared, by the × or Escape. The field's onChange also gets an empty value. */
  onClear?: () => void;
  /** The clear button's name. Default: "Clear search". */
  clearLabel?: string;
  /** Shows a small loader in place of the search icon while results load. Default: false. */
  loading?: boolean;
  /** The loader's name, announced when it appears. Default: "Searching". */
  loadingLabel?: string;
}

/* SearchInput: an Input for searching: a search icon at the start, type="search", and a × at the end once
   something is typed, which clears the field and puts focus back in it. Escape clears it too, and Enter calls
   onSearch. Clearing fires the input's own onChange with an empty value, so controlled and uncontrolled fields
   both work. It uses Input's box and tokens: className and style go to the box; ref and every other prop to the
   <input>. */
/** A search field: a search icon, a clear button once something is typed, Escape to clear and Enter to search. */
export const SearchInput = /* @__PURE__ */ component<HTMLInputElement, SearchInputProps>("SearchInput", function SearchInput(props, ref) {
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const sds = useSerupa();
  const rest = omit(props, { size: 1, invalid: 1, className: 1, style: 1, onSearch: 1, onClear: 1, clearLabel: 1, loading: 1, loadingLabel: 1 } as const);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const el = React.useRef<HTMLInputElement | null>(null);
  const controlled = props.value !== undefined;
  const [typed, setTyped] = React.useState(String(props.defaultValue ?? ""));
  const text = controlled ? String(props.value ?? "") : typed;
  const locked = !!rest.disabled || !!rest.readOnly;
  // A form reset empties the field (or puts defaultValue back): the × follows it, instead of staying on an empty field.
  useFormReset(el, () => { if (!controlled) setTyped(String(props.defaultValue ?? "")); });

  const clear = () => {
    const i = el.current;
    if (!i) return;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (setValue && setValue.set) setValue.set.call(i, ""); else i.value = "";
    i.dispatchEvent(new Event("input", { bubbles: true }));
    if (!controlled) setTyped("");
    i.focus();
    if (props.onClear) props.onClear();
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (!controlled) setTyped(e.target.value); if (rest.onChange) rest.onChange(e); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    if (e.key === "Escape" && e.currentTarget.value !== "" && !locked) { e.preventDefault(); e.stopPropagation(); clear(); }
    else if (e.key === "Enter" && props.onSearch) props.onSearch(e.currentTarget.value);
  };
  return (
    <span className={cn("dk-input dk-search-input", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className)}
      style={props.style} data-component="search-input" data-size={size}>
      <span className="dk-input__icon dk-input__icon--left dk-search-input__icon" aria-hidden={props.loading ? undefined : true}>
        {props.loading ? <Loader size="sm" delay={0} label={props.loadingLabel ?? sds.labels.searching} /> : <Icon icon={icons.Search} />}
      </span>
      <input {...rest} ref={(n) => { el.current = n; if (typeof ref === "function") ref(n); else if (ref) ref.current = n; }}
        type="search" enterKeyHint={rest.enterKeyHint || "search"} className="dk-input__field" onChange={onChange} onKeyDown={onKeyDown} />
      {text !== "" && !locked ? (
        <button type="button" className="dk-search-input__clear" aria-label={props.clearLabel || sds.labels.clearSearch} aria-controls={rest.id}
          onClick={clear} onMouseDown={(e) => e.preventDefault()}>
          <Icon icon={icons.Close} />
        </button>
      ) : null}
    </span>
  );
});
