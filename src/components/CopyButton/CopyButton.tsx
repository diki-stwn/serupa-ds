"use client";
import * as React from "react";
import { cn } from "../../internal/cn";
import { ButtonBase, type ButtonAsButtonProps } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { announce } from "../../internal/announce";
import * as icons from "../../material/builtin";
import { en as words } from "./labels";
import { feedbackHold } from "../../internal/timing";

export interface CopyButtonProps extends Omit<ButtonAsButtonProps, 'value' | 'onCopy' | 'icon' | 'leftIcon' | 'rightIcon' | 'loading' | 'loadingText'> {
  /** What to copy: the text, or a function that returns it (or a promise of it) when the button is pressed. */
  value: string | (() => string | Promise<string>);
  /** The button's text. Default: "Copy" (labels.copy). */
  children?: React.ReactNode;
  /** What it shows and announces once it has copied. Default: "Copied" (labels.copied). */
  copiedLabel?: string;
  /** Shows only the icon, named by children (or "Copy") as its aria-label and tooltip. Default: false. */
  iconOnly?: boolean;
  /** How long it shows "Copied", in ms. Default: 2000. */
  timeout?: number;
  /** Called with the text once it's on the clipboard. */
  onCopy?: (text: string) => void;
  /** Called when the browser refuses (no permission, an insecure page). The button also announces labels.copyFailed. */
  onCopyError?: (error: unknown) => void;
}

// The clipboard API needs a secure page and focus; the old execCommand route covers the rest.
async function write(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch (e) { if (!fallback(text)) throw e; return; }
  }
  if (!fallback(text)) throw new Error("Copying isn't available here.");
}
// A value that's fetched goes to the clipboard as a promise, written within the press: Safari refuses a write once the
// press's user activation has run out, as it may have by the time a fetch ends. Without ClipboardItem (or if the
// browser turns the promise down), it's written once it's there, as before.
function writeLater(text: Promise<string>): Promise<string> {
  const clip = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
  const after = () => text.then((t) => write(t).then(() => t));
  if (typeof ClipboardItem === "undefined" || !clip || !clip.write) return after();
  const blob = text.then((t) => new Blob([t], { type: "text/plain" }));
  blob.catch(() => {});   // a value that fails is reported through the write below, not again as unhandled
  let item: ClipboardItem;
  try { item = new ClipboardItem({ "text/plain": blob }); } catch { return after(); }
  return clip.write([item]).then(() => text, after);
}
function fallback(text: string): boolean {
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; ta.style.insetInlineStart = "-9999px";
  const back = document.activeElement as HTMLElement | null;
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  ta.remove();
  if (back && back.focus) back.focus();
  return ok;
}

/* CopyButton: a Button that copies value to the clipboard, then shows a check and "Copied" for timeout ms and
   says "Copied" to screen readers (politely). If the browser refuses, it says labels.copyFailed instead and calls
   onCopyError. Both labels take the same space, so the button doesn't change width. iconOnly shows just the icon.
   Variant defaults to "outline" and size to "sm"; every other Button prop and ref go to the <button>. */
/** A button that copies text to the clipboard, then shows "Copied" with a check and says so to screen readers. */
export const CopyButton = /* @__PURE__ */ component<HTMLButtonElement, CopyButtonProps>("CopyButton", function CopyButton(props, ref) {
  const sds = useSettings(words);
  const { value, children, copiedLabel, iconOnly, timeout, onCopy, onCopyError, className, variant, size, ...rest } = props;   // the rest is the Button's
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const label = children == null || (children as unknown) === false ? sds.labels.copy : children;
  const done = copiedLabel || sds.labels.copied;
  const name = typeof label === "string" ? label : sds.labels.copy;
  const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) props.onClick(e);
    if (e.defaultPrevented) return;
    try {
      // Nothing awaited before the write starts, so it's still inside the press.
      const got = typeof value === "function" ? value() : value;
      let text: string;
      if (typeof got === "string") { text = got; await write(text); } else text = await writeLater(Promise.resolve(got));
      setCopied(true);
      announce(done);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout ?? feedbackHold);
      if (onCopy) onCopy(text);
    } catch (err) {
      // The last copy's "Copied" may still show: take it away, so the button doesn't say this one worked (L8E60).
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      setCopied(false);
      announce(sds.labels.copyFailed, { assertive: true });
      if (onCopyError) onCopyError(err);
    }
  };
  // Both icons share one cell and cross-fade (KW18): the copy icon gives way to the check as one icon changing.
  const glyph = <span className="dk-copy-btn__icons">
    <Icon icon={icons.ContentCopy} className="dk-copy-btn__icon dk-copy-btn__icon--copy" />
    <Icon icon={icons.Check} className="dk-copy-btn__icon dk-copy-btn__icon--done" />
  </span>;
  const common = {
    ...rest, ref: ref as React.Ref<HTMLElement>, onClick, variant: variant || "outline", size: size || "sm",
    "data-copied": copied ? "" : undefined, className: cn("dk-copy-btn", copied && "dk-copy-btn--copied", className),
  };
  if (iconOnly) return <ButtonBase {...common} icon={glyph} aria-label={copied ? done : name} title={rest.title ?? name} />;
  // Both labels sit in one grid cell, so the button keeps the wider one's width; only the current one is read out.
  return <ButtonBase {...common} leftIcon={glyph}>
    <span className="dk-copy-btn__labels">
      <span className={cn("dk-copy-btn__label", copied && "dk-copy-btn__label--off")} aria-hidden={copied || undefined}>{label}</span>
      <span className={cn("dk-copy-btn__label", !copied && "dk-copy-btn__label--off")} aria-hidden={!copied || undefined}>{done}</span>
    </span>
  </ButtonBase>;
});
