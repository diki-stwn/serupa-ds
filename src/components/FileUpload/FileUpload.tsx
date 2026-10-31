"use client";
import * as React from "react";
import { cn, domId, isInvalid, omit, setRef } from "../../internal/cn";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { useLocale, useSettings } from "../../internal/provider";
import { formatFileSize } from "./formatFileSize";
import * as icons from "../../material/builtin";
import { useFieldLabel } from "../../internal/fieldLabel";
import { useFieldControl } from "../../internal/field";
import { delegateFocus, useAutoFocus } from "../../internal/focus";
import { announce } from "../../internal/announce";
import { useFormReset } from "../../internal/useFormReset";
import { en as words } from "./labels";

export { formatFileSize };

export type FileRejection = { file: File; reason: 'type' | 'size' | 'count' | 'folder' | 'duplicate'; message: string };
export interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'title'> {
  /** The chosen files (controlled). Use with onFilesChange. */
  files?: File[];
  /** Called with the new list when files are added or removed. */
  onFilesChange?: (files: File[]) => void;
  /** Called with the files that weren't added and why. They're also listed under the drop area. */
  onReject?: (rejections: FileRejection[]) => void;
  /** File types to allow, as for <input accept>: "image/*,.pdf". */
  accept?: string;
  /** Allows several files. Default: false (a new file replaces the old one). */
  multiple?: boolean;
  /** The largest file allowed, in bytes. */
  maxSize?: number;
  /** The most files allowed, with multiple. */
  maxFiles?: number;
  /** Turns the drop area and its button off, as a disabled native control. */
  disabled?: boolean;
  /** A danger outline on the drop area, and aria-invalid on the native input; the choose button is described by the error (a button supports neither aria-invalid nor aria-errormessage). In a Field with an error, it's set for you. */
  invalid?: boolean;
  /** Required for the form's check (on the native input) and aria-required on the choose button. In a required Field, aria-required is set for you. */
  required?: boolean;
  /** The chosen files are shown and submitted, but can't be changed: the choose button stays focusable (aria-disabled) and doesn't open the picker, dropped files are ignored and there are no remove buttons. */
  readOnly?: boolean;
  /** Submits the files with a form, through the native file input. */
  name?: string;
  /** The id of the form the files submit with, when the FileUpload sits outside it (like an input's form attribute). */
  form?: string;
  /** The drop area's title. Default: "Drag files here" ("Drag a file here" without multiple). */
  title?: React.ReactNode;
  /** The button's text. Default: "Choose files" ("Choose a file"). */
  buttonLabel?: string;
  /** A muted line, such as "PNG or JPG, up to 5 MB". */
  hint?: React.ReactNode;
  /** The remove buttons' names, given the file name. Default: (name) => `Remove ${name}`. */
  removeLabel?: (name: string) => string;
}

const OWN = { files: 1, onFilesChange: 1, onReject: 1, accept: 1, multiple: 1, maxSize: 1, maxFiles: 1, disabled: 1, name: 1, form: 1, title: 1, buttonLabel: 1, hint: 1, removeLabel: 1, autoFocus: 1, className: 1, id: 1, "aria-describedby": 1, "aria-errormessage": 1, invalid: 1, required: 1, readOnly: 1, "aria-invalid": 1, "aria-required": 1, "aria-readonly": 1 } as const;

// Extensions and types that name the same kind of file. The file picker offers all of them for any one (accept=".jpg"
// shows photo.jpeg too), so the check takes them as well (L8E12); image/jpg isn't a registered type but is often written.
const SAME_EXT = [[".jpg", ".jpeg", ".jpe", ".jfif"], [".tif", ".tiff"], [".htm", ".html"], [".mpg", ".mpeg"], [".yml", ".yaml"], [".mid", ".midi"]];
const SAME_TYPE: Record<string, string> = { "image/jpg": "image/jpeg", "image/pjpeg": "image/jpeg", "audio/mp3": "audio/mpeg", "image/x-png": "image/png" };
function accepts(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase(), type = (file.type || "").toLowerCase(), real = SAME_TYPE[type] || type;
  return accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).some((a) =>
    a.startsWith(".") ? (SAME_EXT.find((g) => g.includes(a)) || [a]).some((e) => name.endsWith(e))
      : a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : real === (SAME_TYPE[a] || a));
}
// accept in short names, for the message on a refused file: "image/*,.pdf" is ["image", "PDF"] ("an image or PDF"),
// ".png,.jpg,.jpeg" is ["PNG", "JPG"]. null when a type has no short name (application/vnd.ms-excel), so the message stays general.
const KINDS: Record<string, string> = { image: "image", video: "video", audio: "audio file", text: "text file" };
const SUBTYPES: Record<string, string> = { jpeg: "JPG", "svg+xml": "SVG", plain: "TXT", "x-icon": "ICO" };
function acceptedTypes(accept: string): string[] | null {
  const names: string[] = [];
  for (const a of accept.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    const [main, sub] = a.split("/");
    const name = a.startsWith(".") ? (a === ".jpeg" ? "JPG" : a.slice(1).toUpperCase())
      : sub === "*" ? KINDS[main] : SUBTYPES[sub] || (/^[a-z0-9]{2,5}$/.test(sub || "") ? sub.toUpperCase() : undefined);
    if (!name) return null;
    if (!names.includes(name)) names.push(name);
  }
  return names.length ? names : null;
}
const iconFor = (f: File) => /^image\//.test(f.type) ? icons.Image : f.type === "application/pdf" ? icons.PictureAsPdf : /^video\//.test(f.type) ? icons.Movie : /^audio\//.test(f.type) ? icons.AudioFile : /zip|compressed|tar/.test(f.type) ? icons.FolderZip : icons.Draft;
const same = (a: File, b: File) => a.name === b.name && a.size === b.size && a.type === b.type;   // the same file picked again

/* A file's name, cut in the middle when it doesn't fit, as Finder and Drive do: the start shrinks to an ellipsis and
   the last few characters and the extension stay, so "report-2025.pdf" and "report-2026.pdf" still look different
   (GR17). dir="auto" lays it out in the name's own direction. The two parts are hidden from screen readers, which
   read the whole name once, and title shows it in full on hover. */
function FileName({ name }: { name: string }) {
  const chars = Array.from(name), dot = name.lastIndexOf(".");
  const ext = dot > 0 ? Array.from(name.slice(dot)).length : 0;
  const keep = Math.min(chars.length, Math.min(ext, 10) + 6);
  return (
    <span className="dk-file-upload__name" dir="auto" title={name}>
      <span className="dk-file-upload__name-start" aria-hidden>{chars.slice(0, chars.length - keep).join("")}</span>
      <span className="dk-file-upload__name-end" aria-hidden>{chars.slice(chars.length - keep).join("")}</span>
      <span className="dk-visually-hidden">{name}</span>
    </span>
  );
}

/* FileUpload: a drop area with a button to choose files, and the chosen files listed under it with their size
   and a remove button. accept, maxSize and maxFiles are checked on the way in; files that don't fit are listed
   in a danger message (role="alert") and passed to onReject. A native file input does the choosing (so name
   submits the files with a form), and files dropped in are put into it too. Uploading is up to you: read the
   files from onFilesChange. */
/** A drop area and a button for choosing files, with the chosen files listed under it. */
export const FileUpload = /* @__PURE__ */ component<HTMLDivElement, FileUploadProps>("FileUpload", function FileUpload(props, ref) {
  const sds = useSettings(words), locale = useLocale();
  props = useFieldControl(props);   // invalid, aria-required and disabled from a surrounding Field, at any depth
  const rest = omit(props, OWN);
  const base = domId("dk-fu", React.useId());
  const inputId = props.id || base + "-input";
  const input = React.useRef<HTMLInputElement | null>(null);
  const chooser = React.useRef<HTMLButtonElement | null>(null);
  // ref.current.focus() and autoFocus land on the button that opens the file picker.
  const choose = () => chooser.current;
  useAutoFocus(props.autoFocus, choose);
  const controlled = props.files !== undefined;
  const [own, setOwn] = React.useState<File[]>([]);
  const files = controlled ? props.files! : own;
  const [rejected, setRejected] = React.useState<FileRejection[]>([]);
  const [over, setOver] = React.useState(false);
  const depth = React.useRef(0);
  const multiple = !!props.multiple, disabled = !!props.disabled;
  const invalid = isInvalid(props.invalid, props["aria-invalid"]);
  const readOnly = !disabled && !!(props.readOnly || props["aria-readonly"] === true || props["aria-readonly"] === "true");
  const still = disabled || readOnly;   // nothing can be added or removed
  // A button can't carry aria-required, so a required upload's button is described by a hidden "Required" first.
  const required = props["aria-required"] != null ? props["aria-required"] === true || props["aria-required"] === "true" : !!props.required;
  const removeLabel = props.removeLabel || ((n: string) => sds.labels.remove + " " + n);

  const L = sds.labels;
  // Submitted without a required file: the browser would focus the hidden input and point its bubble at nothing,
  // so FileUpload says it in its own message and focuses the choose button instead.
  const [missing, setMissing] = React.useState(false);
  const onInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    if (!e.currentTarget.validity.valueMissing) return;
    e.preventDefault();
    setMissing(true);
    const form = e.currentTarget.form;
    const first = form ? Array.from(form.elements).find((x) => (x as HTMLInputElement).willValidate && !(x as HTMLInputElement).validity.valid) : null;
    if ((!first || first === e.currentTarget) && chooser.current) chooser.current.focus();
  };
  const set = (next: File[]) => { if (next.length) setMissing(false); if (!controlled) setOwn(next); if (props.onFilesChange) props.onFilesChange(next); };
  // folders: dropped entries that are folders (FQ1), which arrive as a File with no type and can't be read.
  const add = (list: FileList | File[] | null, folders?: Set<File>) => {
    if (!list || still) return;
    const incoming = Array.from(list), ok: File[] = [], bad: FileRejection[] = [];
    const limit = props.maxSize != null ? formatFileSize(props.maxSize, locale) : "";
    for (const f of incoming) {
      if (folders && folders.has(f)) bad.push({ file: f, reason: "folder", message: L.fileFolder(f.name) });
      else if (!accepts(f, props.accept)) bad.push({ file: f, reason: "type", message: L.fileWrongType(f.name, acceptedTypes(props.accept || "")) });
      else if (props.maxSize != null && f.size > props.maxSize) bad.push({ file: f, reason: "size", message: L.fileTooLarge(f.name, limit) });
      else ok.push(f);
    }
    let next: File[];
    if (!multiple) next = ok.length ? [ok[0]] : files;
    else {
      next = files.slice();
      for (const f of ok) {
        if (next.some((g) => same(f, g))) { bad.push({ file: f, reason: "duplicate", message: L.fileAlreadyAdded(f.name) }); continue; }
        if (props.maxFiles != null && next.length >= props.maxFiles) { bad.push({ file: f, reason: "count", message: L.fileTooMany(f.name, props.maxFiles) }); continue; }
        next.push(f);
      }
    }
    if (!multiple && ok.length > 1) for (const f of ok.slice(1)) bad.push({ file: f, reason: "count", message: L.fileOnlyOne(f.name) });
    setRejected(bad);
    if (bad.length && props.onReject) props.onReject(bad);
    if (next !== files) {
      set(next);
      // Said politely (FQ1): the picker hands focus back to the button, so the list grows out of sight.
      const added = next.filter((f) => !files.includes(f));
      if (added.length) announce(L.filesAdded(added.map((f) => f.name)));
    }
  };
  // Removed, focus moves to the next file's remove button (else the one before, else the choose button), so a
  // keyboard user clearing several files stays in the list (FQ1); the change is said politely.
  const list = React.useRef<HTMLUListElement | null>(null);
  const [refocus, setRefocus] = React.useState<number | null>(null);
  const remove = (f: File) => {
    setRefocus(files.indexOf(f));
    set(files.filter((g) => g !== f)); setRejected([]);
    announce(L.fileRemoved(f.name));
  };
  React.useEffect(() => {
    if (refocus == null) return;
    setRefocus(null);
    const left = list.current ? list.current.querySelectorAll<HTMLButtonElement>("li button") : [];
    const to = left.length ? left[Math.min(refocus, left.length - 1)] : chooser.current;
    if (to) to.focus();
  }, [refocus, files]);

  // A file dropped just outside the area would be opened by the browser in place of the page, losing what was
  // typed (FQ1): while one can be added here, a file drop nothing else took is stopped on the document.
  React.useEffect(() => {
    if (still) return;
    const stop = (e: DragEvent) => {
      if (e.defaultPrevented || !e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes("Files")) return;
      e.preventDefault();
      if (e.type === "dragover") e.dataTransfer.dropEffect = "none";
    };
    document.addEventListener("dragover", stop);
    document.addEventListener("drop", stop);
    return () => { document.removeEventListener("dragover", stop); document.removeEventListener("drop", stop); };
  }, [still]);

  // The form's reset empties the native input: an uncontrolled list empties with it (L8E6); a controlled one stays
  // the app's, so its files go back on the input below.
  const [resets, setResets] = React.useState(0);
  useFormReset(input, () => { if (!controlled) setOwn([]); setRejected([]); setMissing(false); setResets((n) => n + 1); }, props.form);

  // Keep the native input's files in step with the list, so a form sends what's shown.
  React.useEffect(() => {
    const i = input.current;
    if (!i || typeof DataTransfer === "undefined") return;
    try { const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f)); i.files = dt.files; } catch { /* older browsers: the input keeps what was picked */ }
  }, [files, resets]);

  // Only a drag that carries files lights the area up and can be dropped (not text or a link dragged across it).
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types || []).includes("Files");
  const drag = {
    onDragEnter: (e: React.DragEvent) => { if (still || !hasFiles(e)) return; e.preventDefault(); depth.current++; setOver(true); },
    onDragOver: (e: React.DragEvent) => { if (still || !hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; },
    onDragLeave: (e: React.DragEvent) => { if (still || !hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); },
    onDrop: (e: React.DragEvent) => {
      if (still || !hasFiles(e)) return;
      e.preventDefault(); depth.current = 0; setOver(false);
      // The file items line up with dataTransfer.files; a folder's entry says so.
      const dropped = Array.from(e.dataTransfer.files), items = Array.from(e.dataTransfer.items || []).filter((it) => it.kind === "file"), folders = new Set<File>();
      items.forEach((it, i) => { const entry = typeof it.webkitGetAsEntry === "function" ? it.webkitGetAsEntry() : null; if (entry && entry.isDirectory && dropped[i]) folders.add(dropped[i]); });
      add(dropped, folders);
    },
  };
  const hasHint = props.hint != null && props.hint !== "";
  // In a Field (whose <label for> reaches only the hidden input), the button is named "Due date, Choose a file" and
  // described by the Field's hint and error, then its own hint.
  const fieldLabel = useFieldLabel(inputId);
  // A button supports neither aria-invalid nor aria-errormessage (TF1b), so the error is said through its
  // description: Field's error is already in aria-describedby, and an aria-errormessage of your own joins it.
  // aria-invalid goes on the native input, which forms and tests read.
  const errorId = invalid ? props["aria-errormessage"] : undefined;
  const given = props["aria-describedby"];
  const described = cn(required && base + "-req", given, errorId && !(given || "").split(/\s+/).includes(errorId) && errorId, hasHint && base + "-hint", missing && base + "-missing") || undefined;
  return (
    <div {...rest} ref={(n) => { delegateFocus(n, choose); setRef(ref, n); }} className={cn("dk-file-upload", disabled && "dk-file-upload--disabled", readOnly && "dk-file-upload--readonly", (invalid || missing) && "dk-file-upload--invalid", props.className)} data-component="file-upload">
      {/* A click on the area's padding opens the picker too, for the pointer only: the choose button is how the
          keyboard and screen readers reach it, so the area is presentational and carries no state (TF1b). */}
      <div className={cn("dk-file-upload__zone", over && "dk-file-upload__zone--over")} data-dragging={over ? "" : undefined} role="presentation" {...drag}
        onClick={(e) => { if (!still && e.target === e.currentTarget && input.current) input.current.click(); }}>
        <Icon icon={icons.UploadFile} className="dk-file-upload__icon" />
        <p className="dk-file-upload__title">{props.title ?? (multiple ? sds.labels.dragFiles : sds.labels.dragFile)}</p>
        <Button ref={chooser} variant="outline" size="sm" disabled={disabled} onClick={() => { if (!readOnly && input.current) input.current.click(); }}
          aria-disabled={readOnly || undefined}
          aria-labelledby={fieldLabel ? fieldLabel + " " + base + "-choose" : undefined} aria-describedby={described}>
          <span id={base + "-choose"}>{props.buttonLabel || (multiple ? sds.labels.chooseFiles : sds.labels.chooseFile)}</span>
        </Button>
        {required ? <span className="dk-file-upload__required" id={base + "-req"}>{sds.labels.required}</span> : null}
        {hasHint ? <p className="dk-file-upload__hint" id={base + "-hint"}>{props.hint}</p> : null}
        <input ref={input} id={inputId} type="file" className="dk-file-upload__input" tabIndex={-1} aria-hidden name={props.name} form={props.form} accept={props.accept} multiple={multiple} disabled={disabled} required={props.required}
          aria-invalid={invalid || missing || undefined} onChange={(e) => { add(e.target.files); }} onInvalid={onInvalid}
          // A <label for> click opens the picker and focuses this hidden input (no ring, a screen reader on an
          // aria-hidden element): focus goes on to the button, so the picker returns there.
          onFocus={() => { const b = chooser.current; if (b && !b.disabled) b.focus(); }} />
      </div>
      {rejected.length || missing ? (
        <div className="dk-file-upload__errors" role="alert">
          {missing ? <p className="dk-file-upload__error" id={base + "-missing"}><Icon icon={icons.Error} />{L.fileMissing(multiple)}</p> : null}
          {rejected.map((r, i) => <p key={i} className="dk-file-upload__error"><Icon icon={icons.Error} />{r.message}</p>)}
        </div>
      ) : null}
      {files.length ? (
        <ul ref={list} role="list" className="dk-file-upload__list" aria-label={multiple ? sds.labels.chosenFiles : sds.labels.chosenFile}>
          {files.map((f, i) => (
            <li key={f.name + f.size + f.lastModified + i} className="dk-file-upload__item">
              <Icon icon={iconFor(f)} className="dk-file-upload__file-icon" />
              <span className="dk-file-upload__file">
                <FileName name={f.name} />
                <span className="dk-file-upload__size" dir="auto">{formatFileSize(f.size, locale)}</span>
              </span>
              {readOnly ? null : <IconButton icon={icons.Close} label={removeLabel(f.name)} size="sm" disabled={disabled} onClick={() => remove(f)} />}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
