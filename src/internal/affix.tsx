import * as React from "react";
import { activeIn } from "./root";

const has = (n: React.ReactNode) => n != null && n !== false && n !== "";

/** A press anywhere on a field's box (its icons, padding, count or the gap by an affix) focuses the field, as a
    press on the field would; the box shows a text cursor all over. The caret goes to the end when the field wasn't
    focused yet. A press on the field itself, on a control in the box (a clear or reveal button) or in a popup the box
    holds (a date picker's calendar) is left alone. */
export function pressFocuses(field: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) {
  return (e: React.MouseEvent) => {
    const f = field.current, t = e.target as Element;
    if (e.button !== 0 || !f || f.disabled || t === f || t.closest("button, a, input, select, textarea, [tabindex], [popover]")) return;
    e.preventDefault();
    if (activeIn(f) === f) return;
    f.focus();
    try { f.setSelectionRange(f.value.length, f.value.length); } catch { /* email and number fields have no caret to place */ }
  };
}

/** Input's and NumberInput's prefix and suffix: text in the box ("https://", "kg"), its id added to the field's
    aria-describedby so it's heard, and a press on it focuses the field as a press on the field would. */
export function useAffixes(prefix: React.ReactNode, suffix: React.ReactNode, base: string, field: React.RefObject<HTMLInputElement | null>) {
  const ids = [has(prefix) ? base + "-prefix" : "", has(suffix) ? base + "-suffix" : ""].filter(Boolean).join(" ");
  const focus = (e: React.MouseEvent) => { e.preventDefault(); if (field.current && !field.current.disabled) field.current.focus(); };
  const part = (node: React.ReactNode, side: "prefix" | "suffix") => has(node)
    ? <span className={"dk-input__affix dk-input__affix--" + side} id={base + "-" + side} key={side} onMouseDown={focus}>{node}</span> : null;
  return { ids, prefix: part(prefix, "prefix"), suffix: part(suffix, "suffix") };
}
