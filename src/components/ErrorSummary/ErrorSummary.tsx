"use client";
import * as React from "react";
import { cn, setRef } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { en as words } from "./labels";

/** One error in the summary: the field it's about and what's wrong. */
export interface ErrorSummaryItem {
  /** The id of the field (the <input>, <select> or <textarea>, or a group's first control) the error is about. */
  field: string;
  /** What's wrong and how to fix it, as the field's own error says it ("Enter your email address"). */
  message: React.ReactNode;
}

export interface ErrorSummaryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** The errors, in the order of the fields on the page. With none, nothing renders. */
  errors: readonly ErrorSummaryItem[];
  /** The heading. Default: "There is a problem", or "There are N problems". */
  title?: React.ReactNode;
  /** The heading's level, h2 to h6, to fit the page's outline. Default: 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Text under the heading, before the list. */
  description?: React.ReactNode;
  /** Moves focus to the summary when it appears (a submit that failed), so it's read out and seen first. Default: true. */
  autoFocus?: boolean;
}

/* ErrorSummary: after a submit fails, a box at the top of the form with a heading and a list of what's wrong, each
   error a link to its field. It renders only with errors. When it appears, and again when a later submit fails with it
   still showing (its errors change), it takes focus (tabIndex -1, named by its heading), so a screen reader reads it
   and the page scrolls to it. A link moves focus to its field and scrolls the field's label into view, not just the
   control, so the question shows above the answer. className and other props go to the box. */
/** After a failed submit: a heading and a list of the form's errors, each a link that moves focus to its field. */
export const ErrorSummary = /* @__PURE__ */ component<HTMLDivElement, ErrorSummaryProps>("ErrorSummary", function ErrorSummary(props, ref) {
  const sds = useSettings(words);
  const { errors, title, headingLevel, description, autoFocus, className, ...rest } = props;
  const box = React.useRef<HTMLDivElement | null>(null);
  const heading = React.useId();
  const list = errors || [];
  // Focus when the summary appears and whenever its errors change (another failed submit); not on every render.
  const key = list.map((e) => e.field).join("\n");
  React.useEffect(() => {
    if (key && autoFocus !== false && box.current) box.current.focus();
  }, [key, autoFocus]);
  if (!list.length) return null;
  const level = [2, 3, 4, 5, 6].indexOf(headingLevel as number) < 0 ? 2 : (headingLevel as number);
  return (
    <div tabIndex={-1} aria-labelledby={heading} {...rest} ref={(n) => { box.current = n; setRef(ref, n); }} className={cn("dk-error-summary", className)} data-component="error-summary">
      {React.createElement("h" + level, { id: heading, className: "dk-error-summary__title" }, title != null ? title : sds.labels.errorSummaryTitle(list.length))}
      {description != null ? <div className="dk-error-summary__description">{description}</div> : null}
      <ul className="dk-error-summary__list" role="list">
        {list.map((e, k) => (
          <li key={e.field + k} className="dk-error-summary__item">
            <a className="dk-error-summary__link" href={"#" + e.field} onClick={(ev) => go(ev, e.field)}>{e.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
});

// A link moves focus to its field and shows the field's label at the top, not the bare control: for a radio or checkbox
// in a fieldset, the group's legend (the question), else its own label.
// One whose field isn't on the page follows its href like any link.
function go(ev: React.MouseEvent<HTMLAnchorElement>, field: string) {
  const doc = ev.currentTarget.ownerDocument, to = doc.getElementById(field);
  if (!to || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  ev.preventDefault();
  const input = to as HTMLInputElement, set = to.closest("fieldset");
  const legend = set && (input.type === "radio" || input.type === "checkbox") ? set.querySelector("legend") : null;
  const shown = legend || (input.labels && input.labels[0]) || to;
  shown.scrollIntoView({ block: "start" });
  inner(to).focus({ preventScroll: true });
}

// A field id on a group that can't take focus itself (RadioGroup's or Rating's root): its checked radio, else the
// first enabled control in it, as Tab would reach the group (GR15).
const FOCUSABLE = "input:not(:disabled):not([type=hidden]), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])";
function inner(to: HTMLElement): HTMLElement {
  if (to.matches(FOCUSABLE) || to.isContentEditable) return to;
  return to.querySelector<HTMLElement>("input:checked:not(:disabled), [aria-checked=true]:not([aria-disabled=true])") || to.querySelector<HTMLElement>(FOCUSABLE) || to;
}
