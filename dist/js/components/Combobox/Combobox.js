"use client";

// src/components/Combobox/Combobox.tsx
import * as React from "react";
import { cn, domId, isInvalid, omit, oneOf, SIZES } from "../../internal/cn.js";
import { useAnchoredLayer } from "../../internal/useAnchoredLayer.js";
import { Icon } from "../Icon/Icon.js";
import { asIcon } from "../Icon/asIcon.js";
import { Loader } from "../Loader/Loader.js";
import { component } from "../../internal/component.js";
import { FieldContext, useFieldControl } from "../../internal/field.js";
import { useSerupa } from "../../internal/provider.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { isComposing } from "../../internal/ime.js";
import { fieldName } from "../../internal/fieldName.js";
import * as icons from "../../material/builtin.js";
import { fold } from "../../internal/fold.js";
import { announce } from "../../internal/announce.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
var Row = React.memo(function Row2(p) {
  const o = p.o;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      id: p.id,
      role: "option",
      "aria-selected": p.selected,
      "aria-disabled": o.disabled || void 0,
      "aria-description": typeof o.description === "string" && o.description ? o.description : void 0,
      className: cn("dk-combobox__option", p.active && "dk-combobox__option--active", p.selected && "dk-combobox__option--selected"),
      onMouseMove: () => {
        if (!o.disabled && !p.active) p.onMove(o.i);
      },
      onClick: () => p.onPick(o.i)
    },
    /* @__PURE__ */ React.createElement("span", { className: "dk-combobox__text" }, /* @__PURE__ */ React.createElement("span", { className: "dk-combobox__label" }, o.label), o.description != null && o.description !== "" ? /* @__PURE__ */ React.createElement("span", { className: "dk-combobox__description", "aria-hidden": typeof o.description === "string" || void 0 }, o.description) : null),
    p.selected ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.Check, className: "dk-combobox__check" }) : null
  );
});
var Combobox = /* @__PURE__ */ component("Combobox", function Combobox2(props, ref) {
  const nameRef = useNameCheck("Combobox", NAME_HOW.field);
  props = useFieldControl(props);
  const fieldLabel = React.useContext(FieldContext)?.labelId;
  const sds = useSerupa();
  const rest = omit(props, { size: 1, invalid: 1, leftIcon: 1, className: 1, style: 1, options: 1, value: 1, defaultValue: 1, onValueChange: 1, onInputChange: 1, filter: 1, clearable: 1, loading: 1, emptyText: 1, loadingText: 1, toggleLabel: 1, clearLabel: 1, name: 1 });
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const base = domId("dk-cbx", React.useId());
  const opts = React.useMemo(() => (props.options || []).map((o, i) => {
    const x = typeof o === "string" ? { value: o, label: o, i } : { value: String(o.value), label: String(o.label ?? o.value), description: o.description, disabled: !!o.disabled, i };
    return { ...x, folded: fold(x.label) };
  }), [props.options]);
  const controlled = props.value !== void 0;
  const [ownValue, setOwnValue] = React.useState(props.defaultValue ?? null);
  const value = controlled ? props.value ?? null : ownValue;
  const selected = opts.find((o) => o.value === value) || null;
  const [text, setText] = React.useState(selected ? selected.label : "");
  const [typed, setTyped] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const box = React.useRef(null);
  const input = React.useRef(null);
  const pop = React.useRef(null);
  const locked = !!rest.disabled || !!rest.readOnly;
  const showClear = !!props.clearable && value != null && !locked;
  const [name, setName] = React.useState("");
  React.useEffect(() => {
    if (showClear) setName(fieldName(input.current));
  }, [showClear]);
  useFormReset(input, () => {
    if (controlled) return;
    const v = props.defaultValue ?? null, o = opts.find((x) => x.value === v);
    setOwnValue(v);
    setText(o ? o.label : "");
    setTyped(false);
    setOpen(false);
  });
  const label = selected ? selected.label : "";
  const [shownFor, setShownFor] = React.useState([value, label]);
  if (shownFor[0] !== value || shownFor[1] !== label) {
    setShownFor([value, label]);
    if (!open || !typed) setText(label);
  }
  const filter = props.filter;
  const shown = React.useMemo(() => {
    if (!typed || filter === false) return opts;
    if (typeof filter === "function") return opts.filter((o) => filter({ value: o.value, label: o.label }, text));
    const q = fold(text.trim());
    return opts.filter((o) => o.folded.includes(q));
  }, [opts, typed, filter, text]);
  const usable = shown.filter((o) => !o.disabled);
  const commit = (v) => {
    if (!controlled) setOwnValue(v);
    if (v !== value && props.onValueChange) props.onValueChange(v);
  };
  const show = (to) => {
    if (locked) return;
    setOpen(true);
    const list = opts.filter((o) => !o.disabled);
    const sel = selected && !selected.disabled ? selected.i : -1;
    setActive(to === "last" ? sel >= 0 ? sel : list.length ? list[list.length - 1].i : -1 : to === "first" ? sel >= 0 ? sel : list.length ? list[0].i : -1 : sel);
  };
  const hide = (revert = true) => {
    setOpen(false);
    setActive(-1);
    setTyped(false);
    if (revert) setText(selected ? selected.label : "");
  };
  const pick = (o) => {
    if (o.disabled) return;
    commit(o.value);
    setText(o.label);
    setOpen(false);
    setActive(-1);
    setTyped(false);
    if (props.onInputChange && o.label !== text) props.onInputChange(o.label);
  };
  const exact = () => {
    const t = fold(text.trim());
    const same = typed && t ? opts.filter((o) => !o.disabled && o.folded === t) : [];
    return same.length === 1 ? same[0] : null;
  };
  const move = (by) => {
    if (!usable.length) return;
    const i = usable.findIndex((o) => o.i === active);
    const n = i < 0 ? by > 0 ? 0 : usable.length - 1 : (i + by + usable.length) % usable.length;
    setActive(usable[n].i);
  };
  const page = (dir) => {
    if (!usable.length) return;
    const row = pop.current && pop.current.querySelector("[role=option]");
    const h = row ? row.offsetHeight : 0;
    const by = h && pop.current ? Math.max(1, Math.floor(pop.current.clientHeight / h)) : 10;
    const i = usable.findIndex((o) => o.i === active);
    const n = i < 0 ? dir > 0 ? 0 : usable.length - 1 : Math.min(usable.length - 1, Math.max(0, i + dir * by));
    setActive(usable[n].i);
  };
  const onChange = (e) => {
    const t = e.target.value;
    setText(t);
    setTyped(true);
    if (!locked) setOpen(true);
    const q = fold(t.trim());
    const first = opts.find((o) => !o.disabled && (props.filter === false || (typeof props.filter === "function" ? props.filter({ value: o.value, label: o.label }, t) : o.folded.includes(q))));
    setActive(t.trim() && first ? first.i : -1);
    if (props.onInputChange) props.onInputChange(t);
  };
  const onKeyDown = (e) => {
    if (rest.onKeyDown) rest.onKeyDown(e);
    if (e.defaultPrevented || locked || isComposing(e)) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) show(e.altKey ? "selected" : "first");
      else move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) show("last");
      else move(-1);
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      const o = opts[active];
      if (o && shown.includes(o)) pick(o);
      else {
        const x = exact();
        if (x) pick(x);
        else hide();
      }
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      hide();
    } else if ((e.key === "PageDown" || e.key === "PageUp") && open) {
      e.preventDefault();
      page(e.key === "PageDown" ? 1 : -1);
    }
  };
  const onBlur = (e) => {
    if (rest.onBlur) rest.onBlur(e);
    const x = exact();
    if (text.trim() === "" && value != null) {
      commit(null);
      setOpen(false);
      setActive(-1);
      setTyped(false);
      setText("");
    } else if (x) pick(x);
    else hide();
  };
  const clear = () => {
    commit(null);
    setText("");
    setTyped(false);
    setActive(-1);
    if (props.onInputChange) props.onInputChange("");
    if (input.current) input.current.focus();
  };
  const count = usable.length;
  React.useEffect(() => {
    if (!open || !typed || props.loading || !count) return;
    const t = setTimeout(() => announce(sds.labels.resultsCount(count)), 700);
    return () => clearTimeout(t);
  }, [open, typed, props.loading, count, text, sds.labels]);
  useAnchoredLayer(open, pop, box, { placement: "bottom-start", offsetVar: "--dk-combobox-offset", matchWidth: true });
  React.useEffect(() => {
    if (!open || active < 0 || !pop.current) return;
    const el = pop.current.querySelector("#" + base + "-opt-" + active);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [active, open, base]);
  const left = asIcon(props.leftIcon);
  const keep = (e) => e.preventDefault();
  const listId = base + "-list";
  const latest = React.useRef({ pick, opts });
  latest.current = { pick, opts };
  const onMove = React.useCallback((i) => setActive(i), []);
  const onPick = React.useCallback((i) => {
    const l = latest.current;
    const o = l.opts[i];
    if (o) l.pick(o);
  }, []);
  const activeShown = active >= 0 && shown.some((o) => o.i === active);
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      ref: box,
      className: cn("dk-input dk-combobox", "dk-input--size-" + size, invalid && "dk-input--invalid", rest.disabled && "dk-input--disabled", rest.readOnly && "dk-input--readonly", props.className),
      style: props.style,
      "data-component": "combobox",
      "data-size": size,
      "data-state": open ? "open" : "closed"
    },
    left != null && left !== false ? /* @__PURE__ */ React.createElement("span", { className: "dk-input__icon dk-input__icon--left", "aria-hidden": true }, left) : null,
    /* @__PURE__ */ React.createElement(
      "input",
      {
        ...rest,
        ref: (n) => {
          input.current = n;
          nameRef(n);
          if (typeof ref === "function") ref(n);
          else if (ref) ref.current = n;
        },
        type: "text",
        role: "combobox",
        "aria-expanded": open,
        "aria-controls": open ? listId : void 0,
        "aria-autocomplete": "list",
        "aria-haspopup": "listbox",
        "aria-activedescendant": open && activeShown ? base + "-opt-" + active : void 0,
        autoComplete: rest.autoComplete || "off",
        autoCorrect: "off",
        spellCheck: false,
        className: "dk-input__field",
        value: text,
        onChange,
        onKeyDown,
        onBlur,
        onClick: (e) => {
          if (rest.onClick) rest.onClick(e);
          if (!open) show("selected");
        }
      }
    ),
    showClear ? /* @__PURE__ */ React.createElement("button", { type: "button", tabIndex: -1, className: "dk-combobox__button dk-combobox__clear", "aria-label": props.clearLabel || sds.labels.clearValue(name || ""), onMouseDown: keep, onClick: clear }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.Close })) : null,
    /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        tabIndex: -1,
        className: "dk-combobox__button dk-combobox__toggle",
        "aria-label": props.toggleLabel || sds.labels.showOptions,
        "aria-expanded": open,
        "aria-controls": open ? listId : void 0,
        disabled: locked,
        onMouseDown: keep,
        onClick: () => {
          if (open) hide();
          else show("selected");
          if (input.current) input.current.focus();
        }
      },
      /* @__PURE__ */ React.createElement(Icon, { icon: icons.ExpandMore })
    ),
    /* @__PURE__ */ React.createElement("div", { ref: pop, className: "dk-combobox__popup", ...{ popover: "manual" }, hidden: !open || void 0, onMouseDown: keep }, props.loading ? /* @__PURE__ */ React.createElement("div", { className: "dk-combobox__message", role: "status" }, /* @__PURE__ */ React.createElement(Loader, { size: "sm", delay: 0, label: "" }), props.loadingText || sds.labels.loadingResults) : null, /* @__PURE__ */ React.createElement("div", { id: listId, role: "listbox", className: "dk-combobox__listbox", "aria-labelledby": rest["aria-labelledby"] || (rest["aria-label"] ? void 0 : fieldLabel), "aria-label": rest["aria-labelledby"] ? void 0 : rest["aria-label"] }, open ? shown.map((o) => /* @__PURE__ */ React.createElement(Row, { key: o.value, o, id: base + "-opt-" + o.i, active: o.i === active, selected: o.value === value, onMove, onPick })) : null), !props.loading && shown.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "dk-combobox__message", role: "status" }, props.emptyText ?? sds.labels.noResults) : null),
    props.name ? /* @__PURE__ */ React.createElement("input", { type: "hidden", name: props.name, form: rest.form, value: value ?? "", disabled: rest.disabled }) : null
  );
});
export {
  Combobox
};
//# sourceMappingURL=Combobox.js.map
