"use client";
import * as React from "react";
import { cn, oneOf } from "../../internal/cn";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { announce } from "../../internal/announce";
import { Icon } from "../Icon/Icon";
import { Loader } from "../Loader/Loader";
import { Button } from "../Button/Button";
import { RelativeTime } from "../RelativeTime/RelativeTime";
import * as icons from "../../material/builtin";
import { en as words } from "./labels";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface SaveStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Where saving is: 'idle' (nothing to say, renders empty), 'saving', 'saved' or 'error'. */
  status: SaveState;
  /** When the last save finished, for "Saved 2 minutes ago" (kept up to date). Without it, just "Saved". */
  savedAt?: Date | number;
  /** Shows a Try again button after an error; called when it's pressed. */
  onRetry?: () => void;
  /** What went wrong, in place of "Couldn't save" ("Couldn't save: you're offline"). */
  errorText?: React.ReactNode;
}

const STATES: readonly SaveState[] = ["idle", "saving", "saved", "error"];

/* SaveStatus: a small line saying whether an autosaving form or document is saved: a ring and "Saving…", a check and
   "Saved 2 minutes ago" (the time kept current), or an error icon, "Couldn't save" and a Try again button. Screen
   readers hear "Saved" and the error once, politely, when the status changes to them (an error also on the first render); "Saving…" isn't announced (it
   comes and goes with every save), and the time ticking isn't either. The wrapper keeps its place when idle, so the
   layout doesn't jump. className and other props go to the wrapper <div>. */
/** Whether autosaved changes are saved: "Saving…", "Saved 2 minutes ago", or "Couldn't save" with Try again; announced politely. */
export const SaveStatus = /* @__PURE__ */ component<HTMLDivElement, SaveStatusProps>("SaveStatus", function SaveStatus(props, ref) {
  const sds = useSettings(words);
  const { status: _s, savedAt, onRetry, errorText, className, ...rest } = props;
  const status = oneOf(STATES, props.status, "idle");
  const text = React.useRef<HTMLSpanElement | null>(null);
  // A first "Saved" isn't news, but a first error is: a SaveStatus rendered only once a save fails
  // ({failed && <SaveStatus status="error" />}) says it too.
  const before = React.useRef<SaveState>(status === "error" ? "idle" : status);
  React.useEffect(() => {
    const was = before.current;
    before.current = status;
    if (was === status) return;
    if (status === "saved") announce(sds.labels.saved);
    else if (status === "error" && text.current) announce(text.current.textContent || sds.labels.saveFailed);
  }, [status, sds.labels]);
  // The status going out stays a moment, inert and hidden from screen readers, in the same cell as the one coming in,
  // so the two cross-fade (KW19). One keyed list, so the face going out is the same element, which then transitions; with no transition to wait for (reduced motion still fades, a test page doesn't) it
  // goes at once.
  const [shown, setShown] = React.useState(status);
  const [gone, setGone] = React.useState<SaveState | null>(null);
  const [changed, setChanged] = React.useState(false);   // the first status just shows; later ones come in
  if (shown !== status) { setShown(status); setGone(shown === "idle" ? null : shown); setChanged(true); }
  const leaving = React.useRef<HTMLSpanElement | null>(null);
  React.useLayoutEffect(() => {
    if (!gone) return;
    const s = leaving.current && getComputedStyle(leaving.current);
    const ms = s ? Math.max(...s.transitionDuration.split(",").map((d) => parseFloat(d) * (d.trim().endsWith("ms") ? 1 : 1000))) : 0;
    if (!(ms > 0)) { setGone(null); return; }
    const t = window.setTimeout(() => setGone(null), ms + 50);
    return () => window.clearTimeout(t);
  }, [gone]);
  const face = (st: SaveState, out: boolean) => st === "idle" ? null : (
    <span key={st} ref={out ? leaving : undefined} className={"dk-save-status__face dk-save-status__face--" + st} data-leaving={out ? "" : undefined} data-entering={!out && changed ? "" : undefined} inert={out || undefined} aria-hidden={out || undefined}
      onTransitionEnd={out ? (e) => { if (e.target === e.currentTarget && e.propertyName === "opacity") setGone(null); } : undefined}>
      {st === "saving" ? <><Loader className="dk-save-status__icon" size="sm" label="" delay={0} /><span className="dk-save-status__text">{sds.labels.saving}</span></> : null}
      {st === "saved" ? <><Icon className="dk-save-status__icon" icon={icons.Check} /><span className="dk-save-status__text">{sds.labels.saved}{savedAt != null ? <> <RelativeTime date={savedAt} /></> : null}</span></> : null}
      {st === "error" ? <>
        <Icon className="dk-save-status__icon" icon={icons.Error} />
        <span className="dk-save-status__text" ref={out ? undefined : text}>{errorText != null ? errorText : sds.labels.saveFailed}</span>
        {onRetry ? <Button className="dk-save-status__retry" variant="link" size="sm" onClick={() => onRetry()}>{sds.labels.retrySave}</Button> : null}
      </> : null}
    </span>
  );
  return (
    <div {...rest} ref={ref} className={cn("dk-save-status", "dk-save-status--" + status, className)} data-component="save-status" data-state={status}>
      {[gone && gone !== status ? face(gone, true) : null, face(status, false)]}
    </div>
  );
});
