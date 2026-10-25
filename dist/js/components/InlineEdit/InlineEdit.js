"use client";

// src/components/InlineEdit/InlineEdit.tsx
import * as React from "react";
import { cn, domId, omit, oneOf, SIZES } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useAutoFocus } from "../../internal/focus.js";
import { isComposing } from "../../internal/ime.js";
import { useSerupa } from "../../internal/provider.js";
import { Icon } from "../Icon/Icon.js";
import { Input } from "../Input/Input.js";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden.js";
import * as icons from "../../material/builtin.js";
var InlineEdit = /* @__PURE__ */ component("InlineEdit", function InlineEdit2(props, ref) {
  const rest = omit(props, {
    label: 1,
    value: 1,
    defaultValue: 1,
    onValueChange: 1,
    onCancel: 1,
    validate: 1,
    placeholder: 1,
    size: 1,
    editing: 1,
    defaultEditing: 1,
    onEditingChange: 1,
    disabled: 1,
    readOnly: 1,
    editLabel: 1,
    inputProps: 1,
    className: 1,
    autoFocus: 1
  });
  const sds = useSerupa();
  const size = oneOf(SIZES, props.size, "md");
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(props.defaultValue ?? "");
  const value = controlled ? props.value : own;
  const [ownEditing, setOwnEditing] = React.useState(!!props.defaultEditing);
  const locked = !!props.disabled || !!props.readOnly;
  const editing = !locked && (props.editing ?? ownEditing);
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState(null);
  const field = React.useRef(null);
  const view = React.useRef(null);
  const refocus = React.useRef(false);
  const closing = React.useRef(false);
  const errorId = domId("dk-ie", React.useId()) + "-error";
  const setEditing = (on) => {
    if (props.editing === void 0) setOwnEditing(on);
    if (props.onEditingChange) props.onEditingChange(on);
  };
  const open = () => {
    if (locked) return;
    closing.current = false;
    setDraft(value);
    setError(null);
    setEditing(true);
  };
  React.useEffect(() => {
    if (editing && field.current) {
      closing.current = false;
      field.current.focus();
      field.current.select();
    }
  }, [editing]);
  useAutoFocus(props.autoFocus, () => field.current || view.current);
  React.useEffect(() => {
    if (!editing && refocus.current) {
      refocus.current = false;
      if (view.current) view.current.focus();
    }
  }, [editing]);
  const save = (keyboard) => {
    const problem = props.validate ? props.validate(draft) : null;
    if (problem != null && problem !== false && problem !== "") {
      setError(problem);
      return;
    }
    refocus.current = keyboard;
    closing.current = true;
    if (draft !== value) {
      if (!controlled) setOwn(draft);
      if (props.onValueChange) props.onValueChange(draft);
    }
    setError(null);
    setEditing(false);
  };
  const cancel = () => {
    refocus.current = true;
    closing.current = true;
    setDraft(value);
    setError(null);
    setEditing(false);
    if (props.onCancel) props.onCancel();
  };
  const ip = props.inputProps || {};
  const onKeyDown = (e) => {
    if (ip.onKeyDown) ip.onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      save(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    }
  };
  const onBlur = (e) => {
    if (ip.onBlur) ip.onBlur(e);
    if (editing && !closing.current) save(false);
  };
  const empty = value === "";
  const text = /* @__PURE__ */ React.createElement("span", { className: cn("dk-inline-edit__text", empty && "dk-inline-edit__text--placeholder") }, empty ? props.placeholder : value);
  const cls = cn("dk-inline-edit", "dk-inline-edit--size-" + size, editing && "dk-inline-edit--editing", props.disabled && "dk-inline-edit--disabled", error != null && "dk-inline-edit--invalid", props.className);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref, className: cls, "data-component": "inline-edit", "data-size": size, "data-state": editing ? "editing" : "viewing" }, editing ? /* @__PURE__ */ React.createElement(
    Input,
    {
      ...ip,
      ref: field,
      size,
      "aria-label": props.label,
      value: draft,
      invalid: error != null || ip.invalid,
      "aria-describedby": cn(ip["aria-describedby"], error != null && errorId) || void 0,
      onChange: (e) => {
        setDraft(e.target.value);
        if (error != null) setError(null);
        if (ip.onChange) ip.onChange(e);
      },
      onKeyDown,
      onBlur
    }
  ) : locked ? /* @__PURE__ */ React.createElement("span", { className: "dk-inline-edit__view dk-inline-edit__view--static" }, text) : /* @__PURE__ */ React.createElement("button", { type: "button", ref: view, className: "dk-inline-edit__view", onClick: open }, /* @__PURE__ */ React.createElement(VisuallyHidden, null, props.label, ": "), text, /* @__PURE__ */ React.createElement(VisuallyHidden, null, ", ", props.editLabel || sds.labels.edit), /* @__PURE__ */ React.createElement(Icon, { icon: icons.Edit, className: "dk-inline-edit__icon" })), editing && error != null ? /* @__PURE__ */ React.createElement("div", { className: "dk-inline-edit__error", id: errorId }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.Error, className: "dk-inline-edit__error-icon" }), /* @__PURE__ */ React.createElement("span", null, error)) : null);
});
export {
  InlineEdit
};
//# sourceMappingURL=InlineEdit.js.map
