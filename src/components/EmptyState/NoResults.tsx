"use client";
import * as React from "react";
import { buttonClass } from "../Button/buttonClass";
import { asIcon } from "../Icon/asIcon";
import { useSettings } from "../../internal/provider";
import { en as words } from "./labels";

/* EmptyState's no-results parts: the searches to try instead, and the button that clears the filters. A client
   module of its own (they take clicks and read the labels), so EmptyState stays a Server Component. Plain
   <button>s with Button's classes, so an EmptyState doesn't bring all of Button with it. */
export function Suggestions(props: { items: string[]; onPick?: (suggestion: string) => void }) {
  const labels = useSettings(words).labels;
  return (
    <p className="dk-empty-state__suggestions">
      <span>{labels.didYouMean}</span>
      {props.items.map((s) => props.onPick
        ? <button key={s} type="button" className={buttonClass({ variant: "link", size: "sm", className: "dk-empty-state__suggestion" })} onClick={() => props.onPick!(s)}>{s}</button>
        : <strong key={s} className="dk-empty-state__suggestion">{s}</strong>)}
    </p>
  );
}

export function ClearFilters(props: { onClear: () => void; small: boolean }) {
  const labels = useSettings(words).labels;
  return (
    <button type="button" className={buttonClass({ variant: "outline", size: props.small ? "sm" : "md", iconPosition: "left" })} onClick={props.onClear}>
      {asIcon("filter_alt_off")}{labels.clearFilters}
    </button>
  );
}
