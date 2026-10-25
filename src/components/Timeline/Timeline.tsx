"use client";
import * as React from "react";
import { cn, oneOf } from "../../internal/cn";
import { component } from "../../internal/component";
import { type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";

export type TimelineAlign = "start" | "alternate";
export type TimelineStatus = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
const ALIGNS: readonly TimelineAlign[] = ["start", "alternate"];
const STATUSES: readonly TimelineStatus[] = ["neutral", "primary", "success", "warning", "danger", "info"];

export interface TimelineProps extends React.OlHTMLAttributes<HTMLOListElement> {
  /** 'start' (default): every event on one side of the line. 'alternate': from 768px up, events take turns on either side of a centered line; narrower, they stay on one side. */
  align?: TimelineAlign;
  /** TimelineItems, in the order they happened (or newest first: the list keeps whatever order you give). */
  children?: React.ReactNode;
}

export interface TimelineItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
  /** What happened: "Order shipped". */
  title?: React.ReactNode;
  /** When it happened, as people read it: "12 Mar, 14:05" or "2 hours ago". */
  time?: React.ReactNode;
  /** The same moment for machines, on the <time> element: "2026-03-12T14:05". */
  dateTime?: string;
  /** An icon in the marker instead of a dot: a Material Symbols or custom name, or an element. */
  icon?: IconSource;
  /** The marker's color: 'neutral' (default), 'primary', 'success', 'warning', 'danger' or 'info'. It's decoration: say the status in the title too. */
  status?: TimelineStatus;
  /** More about the event, below the title and time. */
  children?: React.ReactNode;
}

/* Timeline: an <ol> of events, each with a marker (a dot or an icon) on a line that joins them, then a title, a
   time and optional content. align="alternate" puts events on both sides of a centered line from 768px up. */
/** An ordered list of events, for activity feeds and order history. */
export const Timeline = /* @__PURE__ */ component<HTMLOListElement, TimelineProps>("Timeline", function Timeline(props, ref) {
  const { className, align, ...rest } = props;
  const a = oneOf(ALIGNS, align, "start");
  return <ol {...rest} ref={ref} className={cn("dk-timeline", a === "alternate" && "dk-timeline--alternate", className)} data-component="timeline" />;
});

/* TimelineItem: an <li> with the marker (aria-hidden: the title says what happened), the title, a <time> and
   the content. The line runs from its marker to the next item's. */
/** One event in a Timeline. */
export const TimelineItem = /* @__PURE__ */ component<HTMLLIElement, TimelineItemProps>("TimelineItem", function TimelineItem(props, ref) {
  const { className, title, time, dateTime, icon, status, children, ...rest } = props;
  const s = oneOf(STATUSES, status, "neutral");
  return (
    <li {...rest} ref={ref} className={cn("dk-timeline__item", "dk-timeline__item--" + s, className)}>
      <span className="dk-timeline__rail" aria-hidden="true">
        <span className={cn("dk-timeline__marker", icon != null && "dk-timeline__marker--icon")}>{icon != null ? asIcon(icon) : null}</span>
      </span>
      <div className="dk-timeline__body">
        {title != null ? <div className="dk-timeline__title">{title}</div> : null}
        {time != null ? <time className="dk-timeline__time" dateTime={dateTime}>{time}</time> : null}
        {children != null ? <div className="dk-timeline__content">{children}</div> : null}
      </div>
    </li>
  );
});
