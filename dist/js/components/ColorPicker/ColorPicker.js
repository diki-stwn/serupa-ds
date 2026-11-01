"use client";

// src/components/ColorPicker/ColorPicker.tsx
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn.js";
import { useServerStyles } from "../../internal/serverStyles.js";
import { component } from "../../internal/component.js";
import { colorName, contrastRatio, normalizeHex } from "../../internal/color.js";
import { delegateFocus, useAutoFocus, windowBlur } from "../../internal/focus.js";
import { FieldContext } from "../../internal/field.js";
import { isComposing } from "../../internal/ime.js";
import { useFieldLabel } from "../../internal/fieldLabel.js";
import { useFieldControl } from "../../internal/field.js";
import { useFormReset } from "../../internal/useFormReset.js";
import { useLocale, useSettings } from "../../internal/provider.js";
import { Icon } from "../Icon/Icon.js";
import { Input } from "../Input/Input.js";
import * as icons from "../../material/builtin.js";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck.js";
import { en as words } from "./labels.js";
var OWN = { "aria-label": 1, "aria-labelledby": 1, swatches: 1, value: 1, defaultValue: 1, onValueChange: 1, onValueCommit: 1, custom: 1, contrastWith: 1, minContrast: 1, size: 1, disabled: 1, name: 1, className: 1, form: 1, required: 1, invalid: 1, "aria-describedby": 1, "aria-errormessage": 1, "aria-required": 1, "aria-invalid": 1, autoFocus: 1 };
var ink = (hex) => (contrastRatio(hex, "#ffffff") || 0) >= (contrastRatio(hex, "#000000") || 0) ? "#ffffff" : "#000000";
var ColorPicker = /* @__PURE__ */ component("ColorPicker", function ColorPicker2(props, ref) {
  const nameRef = useNameCheck("ColorPicker", NAME_HOW.group);
  props = useFieldControl(props);
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const sds = useSettings(words), locale = useLocale();
  const swatches = (props.swatches || []).map((s) => {
    const sw = typeof s === "string" ? { value: s, label: "" } : s;
    const value2 = normalizeHex(sw.value) || sw.value;
    if (sw.label) return { value: value2, label: sw.label, named: true };
    const c = colorName(value2);
    return { value: value2, label: c ? sds.labels.colorName(c.hue, c.tone) : value2, named: false };
  });
  const base = domId("dk-cp", React.useId());
  const root = React.useRef(null);
  const controlled = props.value !== void 0;
  const [own, setOwn] = React.useState(normalizeHex(props.defaultValue || ""));
  const value = controlled ? normalizeHex(props.value || "") : own;
  const disabled = !!props.disabled, custom = props.custom !== false;
  const truthy = (v) => v === true || v === "true";
  const required = !!props.required || truthy(props["aria-required"]);
  const [missing, setMissing] = React.useState(false);
  if (missing && value) setMissing(false);
  const invalid = !!props.invalid || truthy(props["aria-invalid"]) || missing;
  const size = props.size === "sm" ? "sm" : "md";
  const [text, setText] = React.useState((value || "").replace("#", ""));
  const typing = React.useRef(false);
  const [tried, setTried] = React.useState(false);
  const bad = text !== "" && !(text.length > 6 && normalizeHex(text)) && (/[^0-9a-f]/i.test(text) || text.length > 6 || tried && !normalizeHex(text));
  React.useEffect(() => {
    if (!typing.current) setText((value || "").replace("#", ""));
  }, [value]);
  const fieldLabel = useFieldLabel(props.id);
  const labelledBy = props["aria-labelledby"] ?? (props["aria-label"] ? void 0 : fieldLabel);
  const committed = React.useRef(value);
  const commit = (v) => {
    if (v === committed.current) return;
    committed.current = v;
    if (props.onValueCommit) props.onValueCommit(v);
  };
  const commitRef = React.useRef(commit);
  commitRef.current = commit;
  const hidden = React.useRef(null);
  useFormReset(props.name ? hidden : root, () => {
    if (!controlled) {
      const d = normalizeHex(props.defaultValue || "");
      setOwn(d);
      committed.current = d;
    }
  }, props.form);
  const native = React.useRef(null);
  React.useEffect(() => {
    const el = native.current;
    if (!el) return;
    let moved = false;
    const on = () => {
      moved = false;
      const v = normalizeHex(el.value);
      if (v) commitRef.current(v);
    };
    const input = () => {
      moved = true;
      if (valueRef.current === null && el.value === "#000000") chooseRef.current(el.value, false, false);
    };
    const blur = () => {
      if (moved) on();
    };
    el.addEventListener("change", on);
    el.addEventListener("input", input);
    el.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("change", on);
      el.removeEventListener("input", input);
      el.removeEventListener("blur", blur);
    };
  }, [custom]);
  const choose = (hex, focus, final = true) => {
    if (disabled) return;
    const v = normalizeHex(hex);
    if (!v) return;
    if (!controlled) setOwn(v);
    if (v !== value && props.onValueChange) props.onValueChange(v);
    if (final) commit(v);
    if (focus && root.current) {
      const b = root.current.querySelector(`.dk-color-picker__swatch[data-value="${v}"]`);
      if (b) b.focus();
    }
  };
  const chooseRef = React.useRef(choose);
  chooseRef.current = choose;
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const picked = swatches.findIndex((s) => s.value === value);
  const tabStop = picked >= 0 ? picked : 0;
  const onKeyDown = (e) => {
    if (e.defaultPrevented || !swatches.length || e.altKey || e.ctrlKey || e.metaKey) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const i = swatches.findIndex((s) => s.value === e.currentTarget.dataset.value);
    let n;
    switch (e.key) {
      case "ArrowRight":
        n = i + (rtl ? -1 : 1);
        break;
      case "ArrowDown":
        n = i + 1;
        break;
      case "ArrowLeft":
        n = i + (rtl ? 1 : -1);
        break;
      case "ArrowUp":
        n = i - 1;
        break;
      case "Home":
        n = 0;
        break;
      case "End":
        n = swatches.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    choose(swatches[(n + swatches.length) % swatches.length].value, true);
  };
  const onInvalid = (e) => {
    e.preventDefault();
    setMissing(true);
    const form = e.currentTarget.form;
    const first = form ? Array.from(form.elements).find((x) => x.willValidate && !x.validity.valid) : e.currentTarget;
    const b = root.current?.querySelectorAll(".dk-color-picker__swatch")[tabStop];
    if (first === e.currentTarget && b) b.focus();
  };
  const ratio = props.contrastWith && value ? contrastRatio(value, props.contrastWith) : null;
  const min = props.minContrast && props.minContrast > 1 ? props.minContrast : 4.5;
  const fmt = (n) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(Math.floor(n * 10) / 10);
  const low = ratio != null && ratio < min;
  useAutoFocus(props.autoFocus, () => root.current && root.current.querySelectorAll(".dk-color-picker__swatch")[tabStop]);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...rest,
      ref: (n) => {
        root.current = n;
        delegateFocus(n, () => n && n.querySelectorAll(".dk-color-picker__swatch")[tabStop]);
        restyle(n);
      },
      className: cn("dk-color-picker", "dk-color-picker--size-" + size, disabled && "dk-color-picker--disabled", props.className),
      "data-component": "color-picker",
      "data-size": size
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: nameRef,
        role: "radiogroup",
        className: "dk-color-picker__swatches",
        "aria-label": props["aria-label"],
        "aria-labelledby": labelledBy,
        "aria-disabled": disabled || void 0,
        "aria-describedby": props["aria-describedby"],
        "aria-required": required || void 0,
        "aria-invalid": invalid || void 0,
        "aria-errormessage": invalid ? props["aria-errormessage"] : void 0
      },
      swatches.map((s, i) => {
        const on = s.value === value;
        const r = props.contrastWith ? contrastRatio(s.value, props.contrastWith) : null;
        const weak = r != null && r < min;
        const why = r != null ? sds.labels.contrast(fmt(r)) + (weak ? ", " + sds.labels.lowContrast(fmt(min)) : "") : "";
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: s.value + i,
            type: "button",
            role: "radio",
            "aria-checked": on,
            "aria-label": s.label,
            title: s.named ? s.label : s.value,
            "data-value": s.value,
            "aria-describedby": why ? base + "-" + i : void 0,
            "data-low-contrast": weak ? "" : void 0,
            className: cn("dk-color-picker__swatch", on && "dk-color-picker__swatch--checked", weak && "dk-color-picker__swatch--low"),
            style: { "--dk-swatch": s.value, "--dk-swatch-ink": ink(s.value) },
            tabIndex: i === tabStop ? 0 : -1,
            disabled,
            onClick: () => choose(s.value),
            onKeyDown
          },
          on ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.Check, className: "dk-color-picker__check" }) : null,
          why ? /* @__PURE__ */ React.createElement("span", { hidden: true, id: base + "-" + i }, why) : null
        );
      })
    ),
    custom ? (
      // The hex field is a second field of the picker, named "Hex code": not the control a Field labels.
      /* @__PURE__ */ React.createElement(FieldContext.Provider, { value: null }, /* @__PURE__ */ React.createElement("div", { className: "dk-color-picker__custom" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          ref: native,
          type: "color",
          className: "dk-color-picker__native",
          "aria-label": sds.labels.customColor,
          value: value || "#000000",
          disabled,
          "data-empty": value ? void 0 : "",
          onChange: (e) => choose(e.target.value, false, false)
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          size: "sm",
          className: "dk-color-picker__hex",
          "aria-label": sds.labels.hexCode,
          value: text,
          disabled,
          maxLength: 7,
          spellCheck: false,
          autoCorrect: "off",
          autoCapitalize: "off",
          autoComplete: "off",
          leftIcon: /* @__PURE__ */ React.createElement("span", { className: "dk-color-picker__hash" }, "#"),
          "aria-invalid": bad || void 0,
          onFocus: () => {
            typing.current = true;
          },
          onChange: (e) => {
            const t = e.target.value.replace(/^#/, "");
            setText(t);
            setTried(false);
            const v = normalizeHex(t);
            if (v && t.length === 6) choose(v, false, false);
          },
          onPaste: (e) => {
            const t = e.clipboardData.getData("text").trim().replace(/^#/, ""), v = normalizeHex(t);
            if (!v) return;
            e.preventDefault();
            setTried(false);
            const plain = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(t);
            setText(plain ? t : v.slice(1));
            if (t.length !== 3) choose(v, false, false);
          },
          onBlur: (e) => {
            if (windowBlur(e)) return;
            typing.current = false;
            setTried(false);
            const v = normalizeHex(text);
            if (v) choose(v);
            setText((value || "").replace("#", ""));
          },
          onKeyDown: (e) => {
            if (e.key === "Enter" && !isComposing(e)) {
              const v = normalizeHex(text);
              if (v) {
                choose(v);
                setText(v.slice(1));
              } else setTried(true);
            }
          }
        }
      )))
    ) : null,
    props.contrastWith ? /* @__PURE__ */ React.createElement("div", { className: cn("dk-color-picker__contrast", low && "dk-color-picker__contrast--low"), "aria-live": "polite" }, ratio != null ? /* @__PURE__ */ React.createElement(React.Fragment, null, low ? /* @__PURE__ */ React.createElement(Icon, { icon: icons.Warning, className: "dk-color-picker__warning" }) : null, /* @__PURE__ */ React.createElement("span", null, sds.labels.contrast(fmt(ratio)), low ? ", " + sds.labels.lowContrast(fmt(min)) : "")) : null) : null,
    required ? /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "dk-color-picker__validity",
        tabIndex: -1,
        "aria-hidden": true,
        required: true,
        value: value || "",
        onChange: () => {
        },
        disabled,
        form: props.form,
        onInvalid
      }
    ) : null,
    props.name ? /* @__PURE__ */ React.createElement("input", { ref: hidden, type: "hidden", name: props.name, form: props.form, value: value || "", disabled }) : null
  );
});
export {
  ColorPicker
};
//# sourceMappingURL=ColorPicker.js.map
