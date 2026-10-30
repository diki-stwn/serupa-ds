"use client";
import * as React from "react";
import { cn } from "../../internal/cn";
import { component } from "../../internal/component";
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
  const hadFocus = React.useRef(false);
  const num = (n: number) => n.toLocaleString(locale);

  const run = React.useCallback(() => {
    if (busy) return;
    hadFocus.current = !!box.current && box.current.contains(document.activeElement);
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

  // The last page took the focused button away: focus the end text, not the page.
  React.useEffect(() => {
    if (!hasMore && hadFocus.current && end.current && !box.current!.contains(document.activeElement)) end.current.focus();
    if (!hasMore) hadFocus.current = false;
  }, [hasMore]);

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
    <div {...rest} ref={setRef} className={cn("dk-load-more", className)} data-component="load-more">
      {count != null && total != null ? <p className="dk-load-more__summary">{labels.showingOf(num(count), num(total))}</p> : null}
      {hasMore
        ? <Button variant="outline" className="dk-load-more__button" wrap loading={busy} loadingText="" onClick={run}>{label != null ? label : labels.loadMore}</Button>
        : endText !== null ? <p className="dk-load-more__end" ref={end} tabIndex={-1}>{endText !== undefined ? endText : labels.allLoaded}</p> : null}
    </div>
  );
});
