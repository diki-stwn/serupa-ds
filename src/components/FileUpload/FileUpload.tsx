"use client";
import * as React from "react";
import { cn, domId, isInvalid, omit, setRef } from "../../internal/cn";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { useSerupa } from "../../internal/provider";
import { formatFileSize } from "./formatFileSize";
import * as icons from "../../material/builtin";
import { useFieldLabel } from "../../internal/fieldLabel";
import { useFieldControl } from "../../internal/field";
import { delegateFocus, useAutoFocus } from "../../internal/focus";

export { formatFileSize };

export type FileRejection = { file: File; reason: 'type' | 'size' | 'count'; message: string };
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
  disabled?: boolean;
  /** A danger outline on the drop area, and aria-invalid on the choose button. In a Field with an error, it's set for you. */
  invalid?: boolean;
  /** Required for the form's check (on the native input) and aria-required on the choose button. In a required Field, aria-required is set for you. */
  required?: boolean;
  /** The chosen files are shown and submitted, but can't be changed: the choose button stays focusable (aria-disabled) and doesn't open the picker, dropped files are ignored and there are no remove buttons. */
  readOnly?: boolean;
  /** Submits the files with a form, through the native file input. */
  name?: string;
  /** The drop area's title. Default: "Drag files here" ("Drag a file here" without multiple). */
  title?: React.ReactNode;
  /** The button's text. Default: "Choose files" ("Choose a file"). */
  buttonLabel?: string;
  /** A muted line, such as "PNG or JPG, up to 5 MB". */
  hint?: React.ReactNode;
  /** The remove buttons' names, given the file name. Default: (name) => `Remove ${name}`. */
  removeLabel?: (name: string) => string;
}

const OWN = { files: 1, onFilesChange: 1, onReject: 1, accept: 1, multiple: 1, maxSize: 1, maxFiles: 1, disabled: 1, name: 1, title: 1, buttonLabel: 1, hint: 1, removeLabel: 1, autoFocus: 1, className: 1, id: 1, "aria-describedby": 1, "aria-errormessage": 1, invalid: 1, required: 1, readOnly: 1, "aria-invalid": 1, "aria-required": 1, "aria-readonly": 1 } as const;

function accepts(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase(), type = (file.type || "").toLowerCase();
  return accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).some((a) =>
    a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : type === a);
}
// accept in words, for the message on a refused file: "image/*,.pdf" is "an image or PDF", ".png,.jpg,.jpeg"
// is "a PNG or JPG". null when a type has no short name (application/vnd.ms-excel), so the message stays general.
const KINDS: Record<string, string> = { image: "image", video: "video", audio: "audio file", text: "text file" };
const SUBTYPES: Record<string, string> = { jpeg: "JPG", "svg+xml": "SVG", plain: "TXT", "x-icon": "ICO" };
function acceptedTypes(accept: string): string | null {
  const names: string[] = [];
  for (const a of accept.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    const [main, sub] = a.split("/");
    const name = a.startsWith(".") ? (a === ".jpeg" ? "JPG" : a.slice(1).toUpperCase())
      : sub === "*" ? KINDS[main] : SUBTYPES[sub] || (/^[a-z0-9]{2,5}$/.test(sub || "") ? sub.toUpperCase() : undefined);
    if (!name) return null;
    if (!names.includes(name)) names.push(name);
  }
  if (!names.length) return null;
  const first = names[0];   // "an" before a vowel sound: "an image", "an SVG" (said "ess"), "an MP4"
  const an = first === first.toUpperCase() ? /^[AEFHILMNORSX]/.test(first) : /^[aeiou]/.test(first);
  const list = names.length === 1 ? first : names.slice(0, -1).join(", ") + " or " + names[names.length - 1];
  return (an ? "an " : "a ") + list;
}
const iconFor = (f: File) => /^image\//.test(f.type) ? icons.Image : f.type === "application/pdf" ? icons.PictureAsPdf : /^video\//.test(f.type) ? icons.Movie : /^audio\//.test(f.type) ? icons.AudioFile : /zip|compressed|tar/.test(f.type) ? icons.FolderZip : icons.Draft;
const same = (a: File, b: File) => a.name === b.name && a.size === b.size && a.type === b.type;   // the same file picked again

/* FileUpload: a drop area with a button to choose files, and the chosen files listed under it with their size
   and a remove button. accept, maxSize and maxFiles are checked on the way in; files that don't fit are listed
   in a danger message (role="alert") and passed to onReject. A native file input does the choosing (so name
   submits the files with a form), and files dropped in are put into it too. Uploading is up to you: read the
   files from onFilesChange. */
/** A drop area and a button for choosing files, with the chosen files listed under it. */
export const FileUpload = /* @__PURE__ */ component<HTMLDivElement, FileUploadProps>("FileUpload", function FileUpload(props, ref) {
  const sds = useSerupa();
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

  const set = (next: File[]) => { if (!controlled) setOwn(next); if (props.onFilesChange) props.onFilesChange(next); };
  const add = (list: FileList | File[] | null) => {
    if (!list || still) return;
    const incoming = Array.from(list), ok: File[] = [], bad: FileRejection[] = [];
    const limit = props.maxSize != null ? formatFileSize(props.maxSize) : "";
    for (const f of incoming) {
      if (!accepts(f, props.accept)) {
        const types = acceptedTypes(props.accept || "");
        bad.push({ file: f, reason: "type", message: types ? `${f.name} isn't ${types}.` : `${f.name}: this type of file isn't accepted.` });
      }
      else if (props.maxSize != null && f.size > props.maxSize) bad.push({ file: f, reason: "size", message: `${f.name} is larger than ${limit}.` });
      else ok.push(f);
    }
    let next: File[];
    if (!multiple) next = ok.length ? [ok[0]] : files;
    else {
      next = files.slice();
      for (const f of ok) {
        if (next.some((g) => same(f, g))) continue;
        if (props.maxFiles != null && next.length >= props.maxFiles) { bad.push({ file: f, reason: "count", message: `${f.name} wasn't added: up to ${props.maxFiles} ${props.maxFiles === 1 ? "file" : "files"}.` }); continue; }
        next.push(f);
      }
    }
    if (!multiple && ok.length > 1) for (const f of ok.slice(1)) bad.push({ file: f, reason: "count", message: `${f.name} wasn't added: one file only.` });
    setRejected(bad);
    if (bad.length && props.onReject) props.onReject(bad);
    if (next !== files) set(next);
  };
  const remove = (f: File) => { set(files.filter((g) => g !== f)); setRejected([]); if (chooser.current) chooser.current.focus(); };   // the row and its button are gone

  // Keep the native input's files in step with the list, so a form sends what's shown.
  React.useEffect(() => {
    const i = input.current;
    if (!i || typeof DataTransfer === "undefined") return;
    try { const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f)); i.files = dt.files; } catch { /* older browsers: the input keeps what was picked */ }
  }, [files]);

  const drag = {
    onDragEnter: (e: React.DragEvent) => { if (still) return; e.preventDefault(); depth.current++; setOver(true); },
    onDragOver: (e: React.DragEvent) => { if (still) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; },
    onDragLeave: () => { if (still) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); },
    onDrop: (e: React.DragEvent) => { if (still) return; e.preventDefault(); depth.current = 0; setOver(false); add(e.dataTransfer.files); },
  };
  const hasHint = props.hint != null && props.hint !== "";
  // In a Field (whose <label for> reaches only the hidden input), the button is named "Due date, Choose a file" and
  // described by the Field's hint and error, then its own hint.
  const fieldLabel = useFieldLabel(inputId);
  return (
    <div {...rest} ref={(n) => { delegateFocus(n, choose); setRef(ref, n); }} className={cn("dk-file-upload", disabled && "dk-file-upload--disabled", readOnly && "dk-file-upload--readonly", invalid && "dk-file-upload--invalid", props.className)} data-component="file-upload">
      <div className={cn("dk-file-upload__zone", over && "dk-file-upload__zone--over")} data-dragging={over ? "" : undefined} aria-disabled={disabled || undefined} {...drag}
        onClick={(e) => { if (!still && e.target === e.currentTarget && input.current) input.current.click(); }}>
        <Icon icon={icons.UploadFile} className="dk-file-upload__icon" />
        <p className="dk-file-upload__title">{props.title ?? (multiple ? sds.labels.dragFiles : sds.labels.dragFile)}</p>
        <Button ref={chooser} variant="outline" size="sm" disabled={disabled} onClick={() => { if (!readOnly && input.current) input.current.click(); }}
          aria-disabled={readOnly || undefined} aria-invalid={invalid || undefined} aria-errormessage={invalid ? props["aria-errormessage"] : undefined}
          aria-labelledby={fieldLabel ? fieldLabel + " " + base + "-choose" : undefined} aria-describedby={cn(required && base + "-req", props["aria-describedby"], hasHint && base + "-hint") || undefined}>
          <span id={base + "-choose"}>{props.buttonLabel || (multiple ? sds.labels.chooseFiles : sds.labels.chooseFile)}</span>
        </Button>
        {required ? <span className="dk-file-upload__required" id={base + "-req"}>{sds.labels.required}</span> : null}
        {hasHint ? <p className="dk-file-upload__hint" id={base + "-hint"}>{props.hint}</p> : null}
        <input ref={input} id={inputId} type="file" className="dk-file-upload__input" tabIndex={-1} aria-hidden name={props.name} accept={props.accept} multiple={multiple} disabled={disabled} required={props.required}
          onChange={(e) => { add(e.target.files); }} />
      </div>
      {rejected.length ? (
        <div className="dk-file-upload__errors" role="alert">
          {rejected.map((r, i) => <p key={i} className="dk-file-upload__error"><Icon icon={icons.Error} />{r.message}</p>)}
        </div>
      ) : null}
      {files.length ? (
        <ul className="dk-file-upload__list" aria-label={multiple ? sds.labels.chosenFiles : sds.labels.chosenFile}>
          {files.map((f, i) => (
            <li key={f.name + f.size + f.lastModified + i} className="dk-file-upload__item">
              <Icon icon={iconFor(f)} className="dk-file-upload__file-icon" />
              <span className="dk-file-upload__file">
                <span className="dk-file-upload__name">{f.name}</span>
                <span className="dk-file-upload__size">{formatFileSize(f.size)}</span>
              </span>
              {readOnly ? null : <IconButton icon={icons.Close} label={removeLabel(f.name)} size="sm" disabled={disabled} onClick={() => remove(f)} />}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});
