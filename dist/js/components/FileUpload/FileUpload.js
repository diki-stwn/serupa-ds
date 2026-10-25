"use client";

// src/components/FileUpload/FileUpload.tsx
import * as React from "react";
import { cn, domId, isInvalid, omit, setRef } from "../../internal/cn.js";
import { Button } from "../Button/Button.js";
import { IconButton } from "../IconButton/IconButton.js";
import { Icon } from "../Icon/Icon.js";
import { component } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { formatFileSize } from "./formatFileSize.js";
import * as icons from "../../material/builtin.js";
import { useFieldLabel } from "../../internal/fieldLabel.js";
import { useFieldControl } from "../../internal/field.js";
import { delegateFocus, useAutoFocus } from "../../internal/focus.js";
var OWN = { files: 1, onFilesChange: 1, onReject: 1, accept: 1, multiple: 1, maxSize: 1, maxFiles: 1, disabled: 1, name: 1, form: 1, title: 1, buttonLabel: 1, hint: 1, removeLabel: 1, autoFocus: 1, className: 1, id: 1, "aria-describedby": 1, "aria-errormessage": 1, invalid: 1, required: 1, readOnly: 1, "aria-invalid": 1, "aria-required": 1, "aria-readonly": 1 };
function accepts(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase(), type = (file.type || "").toLowerCase();
  return accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).some((a) => a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : type === a);
}
var KINDS = { image: "image", video: "video", audio: "audio file", text: "text file" };
var SUBTYPES = { jpeg: "JPG", "svg+xml": "SVG", plain: "TXT", "x-icon": "ICO" };
function acceptedTypes(accept) {
  const names = [];
  for (const a of accept.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    const [main, sub] = a.split("/");
    const name = a.startsWith(".") ? a === ".jpeg" ? "JPG" : a.slice(1).toUpperCase() : sub === "*" ? KINDS[main] : SUBTYPES[sub] || (/^[a-z0-9]{2,5}$/.test(sub || "") ? sub.toUpperCase() : void 0);
    if (!name) return null;
    if (!names.includes(name)) names.push(name);
  }
  return names.length ? names : null;
}
var iconFor = (f) => /^image\//.test(f.type) ? icons.Image : f.type === "application/pdf" ? icons.PictureAsPdf : /^video\//.test(f.type) ? icons.Movie : /^audio\//.test(f.type) ? icons.AudioFile : /zip|compressed|tar/.test(f.type) ? icons.FolderZip : icons.Draft;
var same = (a, b) => a.name === b.name && a.size === b.size && a.type === b.type;
var FileUpload = /* @__PURE__ */ component("FileUpload", function FileUpload2(props, ref) {
  const sds = useSerupa();
  props = useFieldControl(props);
  const rest = omit(props, OWN);
  const base = domId("dk-fu", React.useId());
  const inputId = props.id || base + "-input";
  const input = React.useRef(null);
  const chooser = React.useRef(null);
  const choose = () => chooser.current;
  useAutoFocus(props.autoFocus, choose);
  const controlled = props.files !== void 0;
  const [own, setOwn] = React.useState([]);
  const files = controlled ? props.files : own;
  const [rejected, setRejected] = React.useState([]);
  const [over, setOver] = React.useState(false);
  const depth = React.useRef(0);
  const multiple = !!props.multiple, disabled = !!props.disabled;
  const invalid = isInvalid(props.invalid, props["aria-invalid"]);
  const readOnly = !disabled && !!(props.readOnly || props["aria-readonly"] === true || props["aria-readonly"] === "true");
  const still = disabled || readOnly;
  const required = props["aria-required"] != null ? props["aria-required"] === true || props["aria-required"] === "true" : !!props.required;
  const removeLabel = props.removeLabel || ((n) => sds.labels.remove + " " + n);
  const L = sds.labels;
  const [missing, setMissing] = React.useState(false);
  const onInvalid = (e) => {
    if (!e.currentTarget.validity.valueMissing) return;
    e.preventDefault();
    setMissing(true);
    const form = e.currentTarget.form;
    const first = form ? Array.from(form.elements).find((x) => x.willValidate && !x.validity.valid) : null;
    if ((!first || first === e.currentTarget) && chooser.current) chooser.current.focus();
  };
  const set = (next) => {
    if (next.length) setMissing(false);
    if (!controlled) setOwn(next);
    if (props.onFilesChange) props.onFilesChange(next);
  };
  const add = (list) => {
    if (!list || still) return;
    const incoming = Array.from(list), ok = [], bad = [];
    const limit = props.maxSize != null ? formatFileSize(props.maxSize) : "";
    for (const f of incoming) {
      if (!accepts(f, props.accept)) bad.push({ file: f, reason: "type", message: L.fileWrongType(f.name, acceptedTypes(props.accept || "")) });
      else if (props.maxSize != null && f.size > props.maxSize) bad.push({ file: f, reason: "size", message: L.fileTooLarge(f.name, limit) });
      else ok.push(f);
    }
    let next;
    if (!multiple) next = ok.length ? [ok[0]] : files;
    else {
      next = files.slice();
      for (const f of ok) {
        if (next.some((g) => same(f, g))) continue;
        if (props.maxFiles != null && next.length >= props.maxFiles) {
          bad.push({ file: f, reason: "count", message: L.fileTooMany(f.name, props.maxFiles) });
          continue;
        }
        next.push(f);
      }
    }
    if (!multiple && ok.length > 1) for (const f of ok.slice(1)) bad.push({ file: f, reason: "count", message: L.fileOnlyOne(f.name) });
    setRejected(bad);
    if (bad.length && props.onReject) props.onReject(bad);
    if (next !== files) set(next);
  };
  const remove = (f) => {
    set(files.filter((g) => g !== f));
    setRejected([]);
    if (chooser.current) chooser.current.focus();
  };
  React.useEffect(() => {
    const i = input.current;
    if (!i || typeof DataTransfer === "undefined") return;
    try {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      i.files = dt.files;
    } catch {
    }
  }, [files]);
  const hasFiles = (e) => Array.from(e.dataTransfer.types || []).includes("Files");
  const drag = {
    onDragEnter: (e) => {
      if (still || !hasFiles(e)) return;
      e.preventDefault();
      depth.current++;
      setOver(true);
    },
    onDragOver: (e) => {
      if (still || !hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e) => {
      if (still || !hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setOver(false);
    },
    onDrop: (e) => {
      if (still || !hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setOver(false);
      add(e.dataTransfer.files);
    }
  };
  const hasHint = props.hint != null && props.hint !== "";
  const fieldLabel = useFieldLabel(inputId);
  return /* @__PURE__ */ React.createElement("div", { ...rest, ref: (n) => {
    delegateFocus(n, choose);
    setRef(ref, n);
  }, className: cn("dk-file-upload", disabled && "dk-file-upload--disabled", readOnly && "dk-file-upload--readonly", (invalid || missing) && "dk-file-upload--invalid", props.className), "data-component": "file-upload" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cn("dk-file-upload__zone", over && "dk-file-upload__zone--over"),
      "data-dragging": over ? "" : void 0,
      "aria-disabled": disabled || void 0,
      ...drag,
      onClick: (e) => {
        if (!still && e.target === e.currentTarget && input.current) input.current.click();
      }
    },
    /* @__PURE__ */ React.createElement(Icon, { icon: icons.UploadFile, className: "dk-file-upload__icon" }),
    /* @__PURE__ */ React.createElement("p", { className: "dk-file-upload__title" }, props.title ?? (multiple ? sds.labels.dragFiles : sds.labels.dragFile)),
    /* @__PURE__ */ React.createElement(
      Button,
      {
        ref: chooser,
        variant: "outline",
        size: "sm",
        disabled,
        onClick: () => {
          if (!readOnly && input.current) input.current.click();
        },
        "aria-disabled": readOnly || void 0,
        "aria-invalid": invalid || missing || void 0,
        "aria-errormessage": invalid ? props["aria-errormessage"] : void 0,
        "aria-labelledby": fieldLabel ? fieldLabel + " " + base + "-choose" : void 0,
        "aria-describedby": cn(required && base + "-req", props["aria-describedby"], hasHint && base + "-hint", missing && base + "-missing") || void 0
      },
      /* @__PURE__ */ React.createElement("span", { id: base + "-choose" }, props.buttonLabel || (multiple ? sds.labels.chooseFiles : sds.labels.chooseFile))
    ),
    required ? /* @__PURE__ */ React.createElement("span", { className: "dk-file-upload__required", id: base + "-req" }, sds.labels.required) : null,
    hasHint ? /* @__PURE__ */ React.createElement("p", { className: "dk-file-upload__hint", id: base + "-hint" }, props.hint) : null,
    /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: input,
        id: inputId,
        type: "file",
        className: "dk-file-upload__input",
        tabIndex: -1,
        "aria-hidden": true,
        name: props.name,
        form: props.form,
        accept: props.accept,
        multiple,
        disabled,
        required: props.required,
        onChange: (e) => {
          add(e.target.files);
        },
        onInvalid,
        onFocus: () => {
          const b = chooser.current;
          if (b && !b.disabled) b.focus();
        }
      }
    )
  ), rejected.length || missing ? /* @__PURE__ */ React.createElement("div", { className: "dk-file-upload__errors", role: "alert" }, missing ? /* @__PURE__ */ React.createElement("p", { className: "dk-file-upload__error", id: base + "-missing" }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.Error }), L.fileMissing(multiple)) : null, rejected.map((r, i) => /* @__PURE__ */ React.createElement("p", { key: i, className: "dk-file-upload__error" }, /* @__PURE__ */ React.createElement(Icon, { icon: icons.Error }), r.message))) : null, files.length ? /* @__PURE__ */ React.createElement("ul", { className: "dk-file-upload__list", "aria-label": multiple ? sds.labels.chosenFiles : sds.labels.chosenFile }, files.map((f, i) => /* @__PURE__ */ React.createElement("li", { key: f.name + f.size + f.lastModified + i, className: "dk-file-upload__item" }, /* @__PURE__ */ React.createElement(Icon, { icon: iconFor(f), className: "dk-file-upload__file-icon" }), /* @__PURE__ */ React.createElement("span", { className: "dk-file-upload__file" }, /* @__PURE__ */ React.createElement("span", { className: "dk-file-upload__name" }, f.name), /* @__PURE__ */ React.createElement("span", { className: "dk-file-upload__size" }, formatFileSize(f.size))), readOnly ? null : /* @__PURE__ */ React.createElement(IconButton, { icon: icons.Close, label: removeLabel(f.name), size: "sm", disabled, onClick: () => remove(f) })))) : null);
});
export {
  FileUpload,
  formatFileSize
};
//# sourceMappingURL=FileUpload.js.map
