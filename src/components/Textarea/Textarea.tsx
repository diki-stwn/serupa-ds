"use client";
import * as React from "react";
import { useValidityMessages } from "../../internal/validity";
import { cn, domId, isInvalid, oneOf, omit, setRef, SIZES, useIsoLayoutEffect } from "../../internal/cn";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { component } from "../../internal/component";
import { useFieldControl } from "../../internal/field";
import { displayNumber } from "../../internal/numbers";
import { useLocale } from "../../internal/provider";
import { useTextLimit } from "../../internal/textLimit";
import { pressFocuses } from "../../internal/affix";

const PLAIN = { useGrouping: false } as const;

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows' | 'children'> {
  /** 'sm' (text-xs), 'md' (text-sm, default) or 'lg' (text-base): Input's text sizes and side padding. */
  size?: 'sm' | 'md' | 'lg';
  /** Visible lines of text: the starting height, and the smallest one with autoResize. Default: 3. */
  rows?: number;
  /** Grows with the text, from rows up to maxRows, and scrolls past that. Turns off the resize handle. Default: false. */
  autoResize?: boolean;
  /** With autoResize: the most lines it grows to before it scrolls. Unset: no limit. */
  maxRows?: number;
  /** 'vertical' (default): a handle to drag the height. 'none': a fixed height. Read-only, disabled and autoResize textareas have none. */
  resize?: 'vertical' | 'none';
  /** A danger border and focus ring, and aria-invalid. Say what's wrong in text next to it, linked with aria-describedby. */
  invalid?: boolean;
  /** A character count under the text, "12 / 200" with maxLength (text-colored once it's reached). Linked to the field with aria-describedby. Default: false. */
  showCount?: boolean;
}

/* Textarea: a multi-line text field, Input's sibling. size "sm", "md" (default) or "lg" (Input's text sizes and
   side padding); rows (default 3); autoResize (grows with the text from rows up to maxRows, then scrolls);
   resize "vertical" (default) or "none"; invalid; showCount (a character count under the text, "12 / 200" with
   maxLength); maxLength (in characters as people see them, like the count, applied by Textarea rather than the
   browser). Renders <span class="dk-textarea"> around a native <textarea>: className and style go to the box,
   every other prop (value, onChange, placeholder, disabled, readOnly, aria-*…) and ref to the <textarea>. */
const OWN = { size: 1, invalid: 1, rows: 1, autoResize: 1, maxRows: 1, resize: 1, showCount: 1, className: 1, style: 1 } as const;

// Whether the browser sizes a field to its content (field-sizing: content: Chromium 123+, Safari 26+). False on the
// server, which only decides the effects there (they don't run), not the markup.
// module state: what the browser supports, the same for every request.
let cssSizing: boolean | undefined;
function sizesInCss(): boolean {
  if (cssSizing === undefined) cssSizing = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("field-sizing", "content");
  return cssSizing;
}

/** A multi-line text field: a native <textarea> (ref, value, onChange and every textarea attribute go to it) in a box that holds the count; className and style go to the box. Label it with <label htmlFor> or aria-label. */
export const Textarea = /* @__PURE__ */ component<HTMLTextAreaElement, TextareaProps>("Textarea", function Textarea(props, ref) {
  const nameRef = useNameCheck("Textarea", NAME_HOW.field);   // warns when it has no accessible name
  props = useFieldControl(props);   // the props a surrounding Field hands it, at any depth
  const rest = omit(props, OWN);
  const size = oneOf(SIZES, props.size, "md");
  const invalid = isInvalid(props.invalid, rest["aria-invalid"]);
  if (invalid) rest["aria-invalid"] = true;
  const rows = (props.rows as number) > 0 ? Math.floor(props.rows as number) : 3;
  const auto = !!props.autoResize;
  const maxRows = (props.maxRows as number) > 0 ? Math.max(rows, Math.floor(props.maxRows as number)) : 0;
  const resize = auto || props.resize === "none" ? "none" : "vertical";
  const own = React.useRef<HTMLTextAreaElement | null>(null);
  // The count and maxLength in characters as people see them; near the limit the count is read out (useTextLimit).
  const { length, max } = useTextLimit(rest, own, { announce: !!props.showCount });
  useValidityMessages(rest, own);   // the browser's message for a failed constraint, in the provider's words
  const countId = domId("dk-ta", React.useId());
  const locale = useLocale();
  const num = (n: number) => displayNumber(n, locale, PLAIN);   // the locale's digits, as Calendar's

  /* Auto-resize: CSS does it where the browser sizes a field to its content (field-sizing, Textarea.css), with no
     measuring and no frame at height auto. Elsewhere: measure the text and set the height, between rows and maxRows lines. */
  const js = auto && !sizesInCss();
  const fit = React.useCallback(function () {
    const el = own.current;
    if (!js || !el) return;
    const cs = getComputedStyle(el), line = parseFloat(cs.lineHeight) || 0, pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    el.style.height = "auto";
    const need = el.scrollHeight, max = maxRows ? maxRows * line + pad : Infinity;
    el.style.height = Math.min(need, max) + "px";
    el.style.overflowY = need > max ? "auto" : "hidden";
  }, [js, maxRows]);
  // A new value (controlled, or a form reset), size or row count; typing refits from the change event, so a
  // replacement of the same length that wraps differently is caught too.
  useIsoLayoutEffect(fit, [fit, rest.value, length, size, rows]);
  if (js) {
    const changed = rest.onChange;
    rest.onChange = function (e: React.ChangeEvent<HTMLTextAreaElement>) { if (changed) changed(e); fit(); };
  }
  React.useEffect(function () {
    if (!js || typeof ResizeObserver === "undefined" || !own.current) return;
    let w = own.current.offsetWidth, raf = 0;
    // Re-wrap when the width changes, on the next frame: resizing the observed element inside the callback
    // raises "ResizeObserver loop completed with undelivered notifications" on window.
    const ro = new ResizeObserver(function () { const nw = own.current && own.current.offsetWidth; if (nw !== w) { w = nw as number; cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); } });
    ro.observe(own.current);
    return function () { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [js, fit]);

  const setRefs = React.useCallback(function (node: HTMLTextAreaElement | null) {
    own.current = node;
    setRef(ref, node);
    nameRef(node);
  }, [ref, nameRef]);
  if (props.showCount) rest["aria-describedby"] = cn(rest["aria-describedby"], countId);
  return (
    <span className={cn("dk-textarea", "dk-textarea--size-" + size, invalid && "dk-textarea--invalid", rest.disabled && "dk-textarea--disabled", rest.readOnly && "dk-textarea--readonly", resize === "none" && "dk-textarea--resize-none", auto && "dk-textarea--auto", props.className)} style={props.style} data-component="textarea" data-size={size} onMouseDown={pressFocuses(own)}>
      <textarea {...rest} ref={setRefs} rows={rows} className="dk-textarea__field" key="field"
        style={auto ? ({ "--dk-ta-rows": rows, "--dk-ta-max-rows": maxRows || undefined } as React.CSSProperties) : undefined} />
      {props.showCount ? <span className={cn("dk-textarea__count", max != null && length >= max && "dk-textarea__count--full")} id={countId} key="count">{max != null ? num(length) + " / " + num(max) : num(length)}</span> : null}
    </span>
  );
});
