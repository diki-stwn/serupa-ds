import * as React from "react";

const has = (n: React.ReactNode) => n != null && n !== false && n !== "";

/** Input's and NumberInput's prefix and suffix: text in the box ("https://", "kg"), its id added to the field's
    aria-describedby so it's heard, and a press on it focuses the field as a press on the field would. */
export function useAffixes(prefix: React.ReactNode, suffix: React.ReactNode, base: string, field: React.RefObject<HTMLInputElement | null>) {
  const ids = [has(prefix) ? base + "-prefix" : "", has(suffix) ? base + "-suffix" : ""].filter(Boolean).join(" ");
  const focus = (e: React.MouseEvent) => { e.preventDefault(); if (field.current && !field.current.disabled) field.current.focus(); };
  const part = (node: React.ReactNode, side: "prefix" | "suffix") => has(node)
    ? <span className={"dk-input__affix dk-input__affix--" + side} id={base + "-" + side} key={side} onMouseDown={focus}>{node}</span> : null;
  return { ids, prefix: part(prefix, "prefix"), suffix: part(suffix, "suffix") };
}
