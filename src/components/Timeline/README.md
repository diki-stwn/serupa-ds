# Timeline

An ordered list of events, each with a marker on a line that joins them, a title, a time and optional content. Use it for activity feeds, order history and audit logs, so people can see what happened and when.

```tsx
import { Timeline, TimelineItem } from "serupa-ds";

<Timeline aria-label="Order history">
  <TimelineItem title="Order placed" time="12 Mar, 09:14" dateTime="2026-03-12T09:14" status="primary" icon="shopping_cart">
    Two items, paid by card.
  </TimelineItem>
  <TimelineItem title="Payment confirmed" time="12 Mar, 09:15" status="success" icon="check" />
  <TimelineItem title="Out for delivery" time="15 Mar, 08:02" />
</Timeline>
```

## When to use

- A record of events in order: an order's progress, a ticket's history, the changes to a document.
- An activity feed, where each event has a time and maybe a little more to say.

## When not to use

- Steps someone still has to work through, with a current one: use [Stepper](../Stepper/README.md).
- Rows to sort, filter or compare: use [Table](../Table/README.md).
- A plain list without times: use a list, or [Sidebar](../Sidebar/README.md) for navigation.

## Usage

- Keep one order, oldest first or newest first, and say which if it isn't obvious.
- Put the status in the title ("Delivery delayed"), not only in the marker's color.
- Give `dateTime` a machine-readable value whenever `time` is relative or shortened ("2 hours ago"), so the moment stays exact.
- Use icons for a few kinds of event that people learn to scan for; dots are enough otherwise.
- `align="alternate"` suits a wide page with short entries. Below 768px it falls back to one side.

## Accessibility

- **Role and name:** an `<ol>`: screen readers announce a list and how many events it has (with `role="list"`, so Safari does too). Name it with `aria-label` or `aria-labelledby` when the page has more than one list.
- **Keyboard:** nothing in the timeline itself is focusable. Links and buttons you put in the content keep their own focus.
- **Contrast:** titles and content read 4.5:1 on the page, and times do too, in all six themes (`Timeline.test.tsx`).
- **Markers:** the marker and line are `aria-hidden`. Color is decoration, so the title has to carry the status. In forced colors, the dots and line draw in the system text color.
- **What's still yours:** a meaningful order, a title for every event, and a `dateTime` when the shown time is relative.

## Props

### Timeline

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `align` | `'start' \| 'alternate'` | `'start'` | `'alternate'` puts events on both sides of a centered line from 768px up |
| `children` | `TimelineItem`s | | The events, in order |
| `id` | `string` | | Goes to the `<ol>` |

`className`, `ref` and other props go to the `<ol>`.

### TimelineItem

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | | What happened |
| `time` | `ReactNode` | | When, as people read it, in a `<time>` |
| `dateTime` | `string` | | The same moment for machines, on the `<time>` |
| `icon` | an icon name or element | | An icon in a tinted circle instead of a dot |
| `status` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` | The marker's color |
| `children` | `ReactNode` | | More about the event, below the title and time |

`className`, `ref` and other props go to the `<li>`.

## Component tokens

Each is an optional override: set it on the page, a container or one Timeline. The list lives in `src/components/Timeline/timeline.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--timeline-text` | `text` | The content's text (4.5:1 on the page). |
| `--timeline-title-color` | `text` | An event's title. |
| `--timeline-time-color` | `text-muted` | An event's time (4.5:1 on the page). |
| `--timeline-line` | `border` | The line joining the markers. |
| `--timeline-line-width` | `border-width-2` | The line's width (2px). |
| `--timeline-marker-size` | `spacing-6` | The marker's box, and the title's line height (24px). |
| `--timeline-dot-size` | `spacing-2_5` | The dot, when there's no icon (10px). |
| `--timeline-icon-size` | `spacing-4` | An icon in the marker (16px). |
| `--timeline-gap` | `spacing-3` | Between the marker and the body (12px). |
| `--timeline-item-gap` | `spacing-6` | Between one event and the next (24px). |
| `--timeline-dot-<status>` | `border-strong`, `primary`, `success`, `warning`, `danger`, `info` | The dot, per status. |
| `--timeline-icon-<status>` | `text-muted`, `primary`, `success-text`, `warning-text`, `danger-text`, `info-text` | An icon, per status. |
| `--timeline-icon-bg-<status>` | `surface-muted`, `primary-subtle`, then each status's `-subtle` | The circle behind an icon, per status. |
