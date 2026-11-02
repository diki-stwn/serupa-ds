"use client";

// src/components/Field/Field.tsx
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn.js";
import { Icon } from "../Icon/Icon.js";
import { named } from "../../internal/component.js";
import { FieldContext } from "../../internal/field.js";
import * as icons from "../../material/builtin.js";
import { FieldLabel } from "../../internal/fieldLabel.js";
import { useSettings } from "../../internal/provider.js";
import { announce, ensureAnnouncer } from "../../internal/announce.js";
import { summarySaysIt } from "../../internal/summaryFocus.js";
import { warnOnce } from "../../internal/warn.js";
import { en as words } from "./labels.js";
import { byId } from "../../internal/root.js";
var LABELABLE = /* @__PURE__ */ new Set(["select", "button", "meter", "output", "progress", "textarea"]);
var OWN = { label: 1, hint: 1, error: 1, required: 1, optional: 1, disabled: 1, group: 1, layout: 1, id: 1, children: 1, className: 1 };
var Field = /* @__PURE__ */ named("Field", function Field2(props) {
  const rest = omit(props, OWN);
  const base = domId("dk-f", React.useId());
  const child = React.Children.count(props.children) === 1 && React.isValidElement(props.children) ? props.children : null;
  const controlId = props.id || child && child.props.id || base + "-control";
  const hasError = props.error != null && props.error !== false && props.error !== "";
  const hintId = props.hint ? base + "-hint" : null, errorId = hasError ? base + "-error" : null;
  const group = !!props.group;
  const sds = useSettings(words);
  const errorRef = React.useRef(null);
  const labelRef = React.useRef(null);
  const said = React.useRef(null);
  React.useEffect(function() {
    ensureAnnouncer();
  }, []);
  React.useEffect(function() {
    const text = errorRef.current ? errorRef.current.textContent || "" : "";
    if (said.current !== null && text && text !== said.current && !summarySaysIt(errorRef.current)) announce(text);
    said.current = text;
  });
  React.useEffect(function() {
    if (process.env.NODE_ENV !== "production" && !group && props.label != null && labelRef.current && !byId(labelRef.current, controlId)) {
      warnOnce("field-control", 'Field: no element has the id "' + controlId + '", so the label names nothing. Put the control inside the Field, or pass its id.');
    }
  });
  const focusControl = function(e) {
    if (e.currentTarget.control) return;
    const el = byId(e.currentTarget, controlId);
    if (el) el.focus();
  };
  const labelKids = [
    props.label,
    props.required ? /* @__PURE__ */ React.createElement("span", { className: "dk-field__required", "aria-hidden": true, key: "req" }, "*") : null,
    // A fieldset can't carry aria-required, and the * is hidden: with group, the legend says it in words (FR1), so the
    // group is read as "Contact by, Required" whatever it holds.
    props.required && group ? /* @__PURE__ */ React.createElement("span", { className: "dk-visually-hidden", key: "req-said" }, " " + sds.labels.required) : null,
    !props.required && props.optional ? /* @__PURE__ */ React.createElement("span", { className: "dk-field__optional", key: "opt" }, typeof props.optional === "string" ? props.optional : sds.labels.fieldOptional) : null
  ];
  const label = props.label == null ? null : group ? React.createElement("legend", { className: "dk-field__label", key: "label" }, ...labelKids) : React.createElement("label", { className: "dk-field__label", htmlFor: controlId, id: base + "-label", key: "label", onClick: focusControl, ref: labelRef }, ...labelKids);
  const hint = props.hint ? /* @__PURE__ */ React.createElement("div", { className: "dk-field__hint", id: hintId, key: "hint" }, props.hint) : null;
  const error = hasError ? /* @__PURE__ */ React.createElement("div", { className: "dk-field__error", key: "error" }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.Error, className: "dk-field__error-icon" }), /* @__PURE__ */ React.createElement("span", { id: errorId, ref: errorRef }, props.error)) : null;
  const described = cn(hintId, errorId);
  const pass = function(el, isControl) {
    if (!React.isValidElement(el)) return el;
    const p = el.props;
    const add = {}, dom = typeof el.type === "string";
    if (isControl && dom && !LABELABLE.has(el.type) && React.Children.toArray(p.children).some(React.isValidElement)) return el;
    if (isControl) {
      if (!p.id) add.id = controlId;
      if (described) add["aria-describedby"] = cn(p["aria-describedby"], described);
      if (errorId && p["aria-errormessage"] == null) add["aria-errormessage"] = errorId;
      if (props.required && p["aria-required"] == null) add["aria-required"] = true;
    }
    if (hasError) {
      if (dom) add["aria-invalid"] = true;
      else add.invalid = true;
    }
    if (props.disabled && !group) add.disabled = true;
    return React.cloneElement(el, add);
  };
  const horizontal = !group && props.layout === "horizontal";
  const cls = cn("dk-field", group && "dk-field--group", horizontal && "dk-field--horizontal", hasError && "dk-field--invalid", props.disabled && "dk-field--disabled", props.className);
  if (group) {
    return /* @__PURE__ */ React.createElement("fieldset", { ...rest, className: cls, disabled: props.disabled || void 0, "aria-describedby": described || void 0, "data-component": "field" }, label, hint, /* @__PURE__ */ React.createElement(FieldContext.Provider, { value: null }, /* @__PURE__ */ React.createElement("div", { className: "dk-field__control", key: "control" }, React.Children.map(props.children, function(c) {
      return pass(c, false);
    }))), error);
  }
  const control = { id: controlId, labelId: props.label == null ? void 0 : base + "-label", describedBy: described || void 0, errorMessage: errorId || void 0, required: props.required || void 0, invalid: hasError || void 0, disabled: props.disabled || void 0 };
  const body = /* @__PURE__ */ React.createElement(FieldContext.Provider, { value: control, key: "body" }, /* @__PURE__ */ React.createElement("div", { className: "dk-field__control", key: "control" }, /* @__PURE__ */ React.createElement(FieldLabel, { value: label ? { control: controlId, label: base + "-label" } : null }, child ? pass(child, true) : props.children)));
  if (horizontal) return /* @__PURE__ */ React.createElement("div", { ...rest, className: cls, "data-component": "field", "data-layout": "horizontal" }, label, /* @__PURE__ */ React.createElement("div", { className: "dk-field__body" }, body, hint, error));
  return /* @__PURE__ */ React.createElement("div", { ...rest, className: cls, "data-component": "field" }, label, hint, body, error);
});
export {
  Field
};
//# sourceMappingURL=Field.js.map
