"use client";
import * as React from "react";
import { cn } from "../../internal/cn";
import { component } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import { useAutoFocus } from "../../internal/focus";
import { useSettings } from "../../internal/provider";
import { en as words } from "./labels";
import { Field } from "../Field/Field";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";

export interface TypeToConfirmProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** What to type to confirm, such as the name of what's deleted ("acme/web"). Spaces around what's typed don't count. */
  phrase: string;
  /** The button's label: the action, in words ("Delete this repository"). */
  confirmLabel: React.ReactNode;
  /** Runs when the button is pressed (or Enter is pressed in the field) with the phrase typed. Can return a promise:
   *  the button shows loading until it settles and takes no second press. */
  onConfirm: () => unknown;
  /** The field's label. Default: "To confirm, type" and the phrase in bold. */
  label?: React.ReactNode;
  /** Help under the label, such as what can't be undone. */
  hint?: React.ReactNode;
  /** Whether letter case must match too. Default: true. */
  caseSensitive?: boolean;
  /** Called when what's typed starts or stops matching the phrase. */
  onMatch?: (matched: boolean) => void;
  /** Disables the field and the button. */
  disabled?: boolean;
}

/* TypeToConfirm: a field and a destructive button for an action that can't be undone. The button takes no press until
   the phrase is typed (it stays focusable, aria-disabled, and says why), so the action needs a deliberate step. Paste
   is allowed (WCAG 3.3.8): the step is reading what's at stake, not retyping it. The field turns off autocomplete,
   spellcheck, autocapitalize and autocorrect, which would change what's typed. Enter in the field confirms once it
   matches. What's typed clears when a Dialog around it closes or its form resets. autoFocus goes to the field (L8E94); className and other props go to the wrapper <div>. */
/** A field and a destructive button: the button works only once the phrase (a name) is typed, for actions that can't be undone. */
export const TypeToConfirm = /* @__PURE__ */ component<HTMLDivElement, TypeToConfirmProps>("TypeToConfirm", function TypeToConfirm(props, ref) {
  const sds = useSettings(words);
  const { phrase, confirmLabel, onConfirm, label, hint, caseSensitive, onMatch, disabled, className, autoFocus, ...rest } = props;
  const [text, setText] = React.useState("");
  // Without case, the Turkish i's fold to one "i" both ways: "İSTANBUL" lowercases to "i" + a dot, and a Turkish
  // browser lowercases the "I" of "INVOICE" to "ı", which the "i" a person types wouldn't match (L8E41).
  const fold = (x: string) => x.toLowerCase().replace(/i\u0307|\u0131/g, "i");
  const same = (a: string, b: string) => (caseSensitive === false ? fold(a) === fold(b) : a === b);
  // Both in one Unicode form: "é" pasted from a macOS file name, or typed by some Vietnamese input methods, is "e" +
  // an accent, and must still match the "é" in the phrase (GR40). NFKC, not NFC: a Japanese or Chinese IME left in
  // full-width mode types "ｍｙ－ｒｅｐｏ", which is "my-repo" to the reader, and runs of spaces (or a no-break
  // space from a copied name) are one space (L8E15).
  const norm = (s: string) => s.normalize("NFKC").trim().replace(/\s+/g, " ");
  const matched = !!phrase && same(norm(text), norm(phrase));
  const told = React.useRef(false);
  React.useEffect(() => {
    if (matched === told.current) return;
    told.current = matched;
    if (onMatch) onMatch(matched);
  }, [matched, onMatch]);
  const button = React.useRef<HTMLButtonElement | null>(null);
  const field = React.useRef<HTMLInputElement | null>(null);
  useAutoFocus(autoFocus, () => field.current);
  // What was typed goes once the Dialog or Drawer around it closes (it stays mounted), or its form resets: reopened,
  // the button would already work, without the deliberate step it's there for (L8E101).
  React.useEffect(() => {
    const at = field.current, box = at && (at.closest("dialog") || at.form);
    if (!box) return;
    const clear = () => setText("");
    const type = box.tagName === "DIALOG" ? "close" : "reset";
    box.addEventListener(type, clear);
    return () => box.removeEventListener(type, clear);
  }, []);
  return (
    <div {...rest} ref={ref} className={cn("dk-type-to-confirm", className)} data-component="type-to-confirm">
      <Field label={label != null ? label : <>{sds.labels.typeToConfirm} <strong className="dk-type-to-confirm__phrase">{phrase}</strong></>} hint={hint} disabled={disabled}>
        {/* An input method's Enter (isComposing, or keyCode 229 after it in Safari) confirms the text, not the action (L8E34). */}
        <Input value={text} onChange={(e) => setText(e.currentTarget.value)} disabled={disabled} ref={field}
          autoComplete="off" spellCheck={false} autoCapitalize="off" autoCorrect="off"
          onKeyDown={(e) => { if (e.key === "Enter" && matched && !isComposing(e) && button.current) { e.preventDefault(); button.current.click(); } }} />
      </Field>
      <Button ref={button} className="dk-type-to-confirm__button" destructive wrap disabled={disabled || !matched}
        disabledReason={disabled ? undefined : sds.labels.typePhraseFirst(phrase)} onClick={() => onConfirm()}>{confirmLabel}</Button>
    </div>
  );
});
