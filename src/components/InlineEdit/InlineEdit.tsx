"use client";
import * as React from "react";
import { cn, domId, omit, oneOf, SIZES } from "../../internal/cn";
import { component } from "../../internal/component";
import { useAutoFocus } from "../../internal/focus";
import { isComposing } from "../../internal/ime";
import { useSerupa } from "../../internal/provider";
import { Icon } from "../Icon/Icon";
import { Input, type InputProps } from "../Input/Input";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import * as icons from "../../material/builtin";

export interface InlineEditProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> {
  /** What the text is ("Project name"): the field's name while editing, and part of the button's name ("Project name: Apollo, Edit"). */
  label: string;
  /** The text (controlled). Use with onValueChange. */
  value?: string;
  /** The text at first (uncontrolled). */
  defaultValue?: string;
  /** Called with the new text when it's saved (Enter, or leaving the field) and has changed. */
  onValueChange?: (value: string) => void;
  /** Called when editing ends without saving (Escape). */
  onCancel?: () => void;
  /** Checks the text before it's saved: return an error message to keep the field open and show it, or nothing to save. */
  validate?: (value: string) => React.ReactNode;
  /** Shown (in the muted color) when the text is empty. */
  placeholder?: string;
  /** 'sm', 'md' (default) or 'lg': Input's heights and text sizes, in both modes, so nothing moves when it opens. */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the field is open (controlled). Use with onEditingChange. */
  editing?: boolean;
  /** Called with true when it opens and false when it closes. */
  onEditingChange?: (editing: boolean) => void;
  /** Shows the text without an edit button. */
  disabled?: boolean;
  /** Shows the text without an edit button, in the full text color. */
  readOnly?: boolean;
  /** The word after the text in the button's name. Default: "Edit" (from SerupaProvider labels). */
  editLabel?: string;
  /** Props for the <input> while editing: maxLength, autoComplete, spellCheck, inputMode… */
  inputProps?: Omit<InputProps, 'value' | 'defaultValue' | 'size' | 'aria-label'>;
}

/* InlineEdit: text that turns into a field in place. It shows the text in a button (with a pencil); a click, Enter or
   Space opens an Input with the text selected. Enter or leaving the field saves (after validate, which can keep it
   open with an error), Escape puts the text back. Keyboard saves and cancels return focus to the button. Both modes
   share Input's height and padding, so the page doesn't move. className and other props go to the outer <div>. */
/** Text people can click to edit in place: Enter or leaving saves, Escape cancels. */
export const InlineEdit = /* @__PURE__ */ component<HTMLDivElement, InlineEditProps>("InlineEdit", function InlineEdit(props, ref) {
  const rest = omit(props, { label: 1, value: 1, defaultValue: 1, onValueChange: 1, onCancel: 1, validate: 1, placeholder: 1, size: 1, editing: 1,
    onEditingChange: 1, disabled: 1, readOnly: 1, editLabel: 1, inputProps: 1, className: 1, autoFocus: 1 } as const);
  const sds = useSerupa();
  const size = oneOf(SIZES, props.size, "md");
  const controlled = props.value !== undefined;
  const [own, setOwn] = React.useState(props.defaultValue ?? "");
  const value = controlled ? (props.value as string) : own;
  const [ownEditing, setOwnEditing] = React.useState(false);
  const locked = !!props.disabled || !!props.readOnly;
  const editing = !locked && (props.editing ?? ownEditing);
  const [draft, setDraft] = React.useState(value);
  const [error, setError] = React.useState<React.ReactNode>(null);
  const field = React.useRef<HTMLInputElement | null>(null);
  const view = React.useRef<HTMLButtonElement | null>(null);
  const refocus = React.useRef(false);   // a keyboard save or cancel puts focus back on the button
  const closing = React.useRef(false);   // saved or cancelled: the blur from the field going away saves nothing
  const errorId = domId("dk-ie", React.useId()) + "-error";

  const setEditing = (on: boolean) => {
    if (props.editing === undefined) setOwnEditing(on);
    if (props.onEditingChange) props.onEditingChange(on);
  };
  const open = () => { if (locked) return; closing.current = false; setDraft(value); setError(null); setEditing(true); };
  // Opening (by a click, a key or the editing prop) focuses the field with its text selected.
  React.useEffect(() => { if (editing && field.current) { closing.current = false; field.current.focus(); field.current.select(); } }, [editing]);
  useAutoFocus(props.autoFocus, () => field.current || view.current);
  React.useEffect(() => { if (!editing && refocus.current) { refocus.current = false; if (view.current) view.current.focus(); } }, [editing]);

  const save = (keyboard: boolean) => {
    const problem = props.validate ? props.validate(draft) : null;
    if (problem != null && problem !== false && problem !== "") { setError(problem); return; }
    refocus.current = keyboard; closing.current = true;
    if (draft !== value) {
      if (!controlled) setOwn(draft);
      if (props.onValueChange) props.onValueChange(draft);
    }
    setError(null); setEditing(false);
  };
  const cancel = () => {
    refocus.current = true; closing.current = true;
    setDraft(value); setError(null); setEditing(false);
    if (props.onCancel) props.onCancel();
  };
  const ip = props.inputProps || {};
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (ip.onKeyDown) ip.onKeyDown(e);
    if (e.defaultPrevented || isComposing(e)) return;
    if (e.key === "Enter") { e.preventDefault(); save(true); }
    // Escape cancels the edit only: a Dialog or Drawer around it stays open.
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (ip.onBlur) ip.onBlur(e);
    if (editing && !closing.current) save(false);
  };

  const empty = value === "";
  const text = <span className={cn("dk-inline-edit__text", empty && "dk-inline-edit__text--placeholder")}>{empty ? props.placeholder : value}</span>;
  const cls = cn("dk-inline-edit", "dk-inline-edit--size-" + size, editing && "dk-inline-edit--editing", props.disabled && "dk-inline-edit--disabled", error != null && "dk-inline-edit--invalid", props.className);
  return (
    <div {...rest} ref={ref} className={cls} data-component="inline-edit" data-size={size} data-state={editing ? "editing" : "viewing"}>
      {editing ? (
        <Input {...ip} ref={field} size={size} aria-label={props.label} value={draft} invalid={error != null || ip.invalid}
          aria-describedby={cn(ip["aria-describedby"], error != null && errorId) || undefined}
          onChange={(e) => { setDraft(e.target.value); if (error != null) setError(null); if (ip.onChange) ip.onChange(e); }} onKeyDown={onKeyDown} onBlur={onBlur} />
      ) : locked ? (
        <span className="dk-inline-edit__view dk-inline-edit__view--static">{text}</span>
      ) : (
        <button type="button" ref={view} className="dk-inline-edit__view" onClick={open}>
          <VisuallyHidden>{props.label}: </VisuallyHidden>
          {text}
          <VisuallyHidden>, {props.editLabel || sds.labels.edit}</VisuallyHidden>
          <Icon icon={icons.Edit} className="dk-inline-edit__icon" />
        </button>
      )}
      {editing && error != null ? <div className="dk-inline-edit__error" id={errorId}><Icon icon={icons.Error} className="dk-inline-edit__error-icon" /><span>{error}</span></div> : null}
    </div>
  );
});
