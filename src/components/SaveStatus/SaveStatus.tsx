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
   readers hear "Saved" and the error once, politely, when the status changes to them; "Saving…" isn't announced (it
   comes and goes with every save), and the time ticking isn't either. The wrapper keeps its place when idle, so the
   layout doesn't jump. className and other props go to the wrapper <div>. */
/** Whether autosaved changes are saved: "Saving…", "Saved 2 minutes ago", or "Couldn't save" with Try again; announced politely. */
export const SaveStatus = /* @__PURE__ */ component<HTMLDivElement, SaveStatusProps>("SaveStatus", function SaveStatus(props, ref) {
  const sds = useSettings(words);
  const { status: _s, savedAt, onRetry, errorText, className, ...rest } = props;
  const status = oneOf(STATES, props.status, "idle");
  const text = React.useRef<HTMLSpanElement | null>(null);
  const before = React.useRef(status);
  React.useEffect(() => {
    const was = before.current;
    before.current = status;
    if (was === status) return;
    if (status === "saved") announce(sds.labels.saved);
    else if (status === "error" && text.current) announce(text.current.textContent || sds.labels.saveFailed);
  }, [status, sds.labels]);
  return (
    <div {...rest} ref={ref} className={cn("dk-save-status", "dk-save-status--" + status, className)} data-component="save-status" data-state={status}>
      {status === "saving" ? <><Loader className="dk-save-status__icon" size="sm" label="" delay={0} /><span className="dk-save-status__text">{sds.labels.saving}</span></> : null}
      {status === "saved" ? <><Icon className="dk-save-status__icon" icon={icons.Check} /><span className="dk-save-status__text">{sds.labels.saved}{savedAt != null ? <> <RelativeTime date={savedAt} /></> : null}</span></> : null}
      {status === "error" ? <>
        <Icon className="dk-save-status__icon" icon={icons.Error} />
        <span className="dk-save-status__text" ref={text}>{errorText != null ? errorText : sds.labels.saveFailed}</span>
        {onRetry ? <Button className="dk-save-status__retry" variant="link" size="sm" onClick={() => onRetry()}>{sds.labels.retrySave}</Button> : null}
      </> : null}
    </div>
  );
});
