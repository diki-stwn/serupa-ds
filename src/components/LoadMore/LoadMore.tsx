"use client";
import * as React from "react";
import { cn } from "../../internal/cn";
import { component } from "../../internal/component";
import { activeIn } from "../../internal/root";
import { useLocale, useSettings } from "../../internal/provider";
import { announce } from "../../internal/announce";
import { Button } from "../Button/Button";
import { en as words } from "./labels";

export interface LoadMoreProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Loads the next page. Return a promise: the button shows loading and takes no second press until it settles. */
  onLoadMore: () => void | PromiseLike<unknown>;
  /** false once there's nothing more: the button gives way to "You've reached the end" (endText). Default: true. */
  hasMore?: boolean;
  /** Loading from outside (your own fetch state), on top of a promise from onLoadMore. */
  loading?: boolean;
  /** How many items are shown now. When it grows, the number added is announced ("20 more loaded"). */
  count?: number;
  /** How many there are in all: with count, shows "Showing 20 of 134" and adds it to the announcement. */
  total?: number;
  /** Loads on its own when the button scrolls near the viewport (infinite scroll); the button stays for keyboard users
      and as the fallback. It loads once each time it comes near, and again only after count changes. Default: false. */
  infinite?: boolean;
  /** The button's text, in place of "Load more" ("Show 20 more"). */
  label?: React.ReactNode;
  /** Shown in place of the button once hasMore is false. Default: "You've reached the end"; null shows nothing. */
  endText?: React.ReactNode;
}

const isThenable = (v: unknown): v is PromiseLike<unknown> => v != null && typeof (v as PromiseLike<unknown>).then === "function";

/* LoadMore: the end of a list that loads in pages: "Showing 20 of 134" over a Load more button, which gives way to
   "You've reached the end". What a load added is said politely ("20 more loaded. Showing 40 of 134."), since new
   items appear in silence otherwise. infinite loads as the button nears the viewport, once per approach and again
   only when count changes, so a load that adds nothing can't loop. Focus stays on the button, which moves down below
   the new items; when the last page leaves no button, focus goes to the end text instead of the page. */
/** The end of a paged list: "Showing 20 of 134", a Load more button (or infinite scroll), and an announcement of what each load added. */
export const LoadMore = /* @__PURE__ */ component<HTMLDivElement, LoadMoreProps>("LoadMore", function LoadMore(props, ref) {
  const sds = useSettings(words), labels = sds.labels, locale = useLocale();
  const { onLoadMore, hasMore: more, loading, count, total, infinite, label, endText, className, ...rest } = props;
  const hasMore = more !== false;
  const [pending, setPending] = React.useState(false);
  const busy = !!loading || pending;
  const box = React.useRef<HTMLDivElement | null>(null);
  const end = React.useRef<HTMLParagraphElement | null>(null);
  const summary = React.useRef<HTMLParagraphElement | null>(null);
  const hadFocus = React.useRef(false);
  // A load from the focused button, with the count it started at: keep the button in view once it lands (GR2).
  const follow = React.useRef<{ from: number | undefined } | null>(null);
  const num = (n: number) => n.toLocaleString(locale);

  const run = React.useCallback(() => {
    if (busy) return;
    hadFocus.current = !!box.current && box.current.contains(activeIn(box.current));   // its own root's focus, in a shadow root too (GR90)
    follow.current = hadFocus.current ? { from: count } : null;
    const out = onLoadMore();
    if (!isThenable(out)) return;
    setPending(true);
    const done = () => setPending(false);
    out.then(() => { done(); if (count == null) announce(labels.moreLoaded); }, done);
  }, [busy, onLoadMore, count, labels]);

  // What a load added, said once count grows (with the labels and total of that render).
  const latest = React.useRef({ labels, total, locale });
  // every render: keeps the latest labels and total for the announcement below.
  React.useEffect(() => { latest.current = { labels, total, locale }; });
  const before = React.useRef(count);
  React.useEffect(() => {
    const was = before.current;
    before.current = count;
    if (count == null || was == null || count <= was) return;
    const { labels: l, total: all, locale: at } = latest.current, n = (x: number) => x.toLocaleString(at);
    const added = l.loadedMore(n(count - was));
    announce(all != null ? added + ". " + l.showingOf(n(count), n(all)) + "." : added);
  }, [count]);

  // The last page took the focused button away: focus the end text, not the page (with endText={null}, the summary;
  // with neither, LoadMore itself, focusable only until focus leaves it, so Tab goes on from here: L8E58).
  React.useEffect(() => {
    const to = end.current || summary.current || box.current;
    if (!hasMore && hadFocus.current && to && !box.current!.contains(activeIn(box.current))) {
      if (to === box.current) to.tabIndex = -1;
      to.focus();
    }
    if (!hasMore) hadFocus.current = false;
  }, [hasMore]);

  // The new items pushed the focused button down, maybe off screen: once the load settles, scroll it back into view
  // (only as far as needed), so a keyboard user sees where they are and doesn't press again blind (GR2).
  React.useEffect(() => {
    // Landed: settled, and with count, once it has grown (the items can arrive after the promise settles).
    if (busy || !follow.current || count != null && count === follow.current.from) return;
    follow.current = null;
    const at = activeIn(box.current) as HTMLElement | null;
    if (at && box.current && box.current.contains(at) && typeof at.scrollIntoView === "function") at.scrollIntoView({ block: "nearest" });
  }, [busy, count]);

  // infinite: load as it nears the viewport, once per approach, and again only when count changes.
  const [near, setNear] = React.useState(false);
  React.useEffect(() => {
    if (!infinite || !box.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setNear(es[es.length - 1].isIntersecting), { rootMargin: "0px 0px 200px 0px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, [infinite]);
  const loadedAt = React.useRef<number | undefined | null>(null);   // the count an automatic load last ran at
  React.useEffect(() => {
    if (!near) { loadedAt.current = null; return; }
    if (!infinite || !hasMore || busy || loadedAt.current !== null && loadedAt.current === count) return;
    loadedAt.current = count;
    run();
  }, [near, infinite, hasMore, busy, count, run]);

  const setRef = React.useCallback((node: HTMLDivElement | null) => {
    box.current = node;
    if (typeof ref === "function") ref(node); else if (ref) ref.current = node;
  }, [ref]);

  return (
    <div {...rest} ref={setRef} className={cn("dk-load-more", className)} data-component="load-more"
      onBlur={(e) => { if (rest.onBlur) rest.onBlur(e); if (e.target === e.currentTarget) e.currentTarget.removeAttribute("tabindex"); }}>
      {count != null && total != null ? <p ref={summary} className="dk-load-more__summary" tabIndex={!hasMore && endText === null ? -1 : undefined}>{labels.showingOf(num(count), num(total))}</p> : null}
      {hasMore
        ? <Button variant="outline" className="dk-load-more__button" wrap loading={busy} loadingText="" onClick={run}>{label != null ? label : labels.loadMore}</Button>
        : endText !== null ? <p className="dk-load-more__end" ref={end} tabIndex={-1}>{endText !== undefined ? endText : labels.allLoaded}</p> : null}
    </div>
  );
});
