import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import type { IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import { component } from "../../internal/component";
import { AnnounceText } from "./AnnounceText";
import { ClearFilters, Suggestions } from "./NoResults";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** A picture of what's missing: an icon name ('inbox', 'search_off') or an element (an illustration). */
  icon?: IconSource;
  /** What's empty, in a few words: "No projects yet". */
  title: React.ReactNode;
  /** What it means or what to do next. */
  description?: React.ReactNode;
  /** One or two Buttons: the way out ("New project"). */
  actions?: React.ReactNode;
  /** 'md' (default) or 'sm' (inside a card, a table or a menu). */
  size?: 'sm' | 'md';
  /** 'plain' (default) or 'dashed': a dashed frame, for a drop zone or a slot to fill. */
  variant?: 'plain' | 'dashed';
  /** The title's heading level, to fit the page outline. Default: 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Says the title and description to screen readers once, politely, as it appears: for a result shown after a search
      or a filter ("No results for “mars”"), which would otherwise appear in silence. Not for an empty page on arrival. Default: false. */
  announce?: boolean;
  /** After a search that found nothing: searches to try instead, such as a spelling fix ("Did you mean: mars").
      Each is a link-style button that calls onSuggestion; without onSuggestion they're plain text. */
  suggestions?: string[];
  /** Called with the suggestion picked: run that search. */
  onSuggestion?: (suggestion: string) => void;
  /** Adds a "Clear filters" button after the actions, which calls this: the usual way out of no results. */
  onClearFilters?: () => void;
}

/* EmptyState: what a page or a panel shows when there's nothing in it yet (or nothing matches): an icon in a
   circle, a title, a short description and the action that fills it. Centered. After a search that found nothing,
   suggestions offers other searches and onClearFilters adds a "Clear filters" button. With announce, the title and
   description go to the shared polite announcer as it appears (a "No results" after a search). className and every
   other prop go to the wrapper. */
/** What to show when there's nothing yet: an icon, a title, a description and the action that fills it. */
export const EmptyState = /* @__PURE__ */ component<HTMLDivElement, EmptyStateProps>("EmptyState", function EmptyState(props, ref) {
  const rest = omit(props, { icon: 1, title: 1, description: 1, actions: 1, size: 1, variant: 1, headingLevel: 1, announce: 1, suggestions: 1, onSuggestion: 1, onClearFilters: 1, className: 1 });
  const size = oneOf(["sm", "md"] as const, props.size, "md");
  const variant = oneOf(["plain", "dashed"] as const, props.variant, "plain");
  const level = [2, 3, 4, 5, 6].indexOf(props.headingLevel as number) >= 0 ? props.headingLevel : 3;
  const H = ("h" + level) as "h3";
  const icon = asIcon(props.icon as React.ReactNode);
  const suggestions = (props.suggestions || []).filter(Boolean);
  const clear = props.onClearFilters ? <ClearFilters onClear={props.onClearFilters} small={size === "sm"} /> : null;
  return (
    <div {...rest} ref={ref} data-component="empty-state" className={cn("dk-empty-state", size === "sm" && "dk-empty-state--sm", variant === "dashed" && "dk-empty-state--dashed", props.className)}>
      {icon != null ? <div className={cn("dk-empty-state__icon", typeof props.icon !== "string" && "dk-empty-state__icon--custom")} aria-hidden="true">{icon}</div> : null}
      <div className="dk-empty-state__text">
        <H className="dk-empty-state__title">{props.title}</H>
        {props.description != null ? <p className="dk-empty-state__description">{props.description}</p> : null}
        {suggestions.length ? <Suggestions items={suggestions} onPick={props.onSuggestion} /> : null}
        {props.announce ? <AnnounceText /> : null}
      </div>
      {props.actions != null || clear ? <div className="dk-empty-state__actions">{props.actions}{clear}</div> : null}
    </div>
  );
});
