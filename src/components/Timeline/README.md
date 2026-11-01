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

## Anatomy

Drawn from the `Alternate` story.

1. **Rail** (`.dk-timeline__rail`): the line the events hang on, oldest to newest.
2. **Event** (`.dk-timeline__item`): one thing that happened.
3. **Marker** (`.dk-timeline__marker`): a dot or an icon on the rail, in the event's tone.
4. **Time** (`.dk-timeline__time`): when it happened.
5. **Title** (`.dk-timeline__title`): what happened.
6. **Body** (`.dk-timeline__body`): more about it.

## Usage

- Keep one order, oldest first or newest first, and say which if it isn't obvious.
- Put the status in the title ("Delivery delayed"), not only in the marker's color.
- Give `dateTime` a machine-readable value whenever `time` is relative or shortened ("2 hours ago"), so the moment stays exact. Without `dateTime` the time is a plain `<span>`: a `<time>` needs a value machines can read.
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

<!-- token-table:start (made from timeline.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--timeline-text` | `text` | The content's text (4.5:1 on the page). |
| `--timeline-title-color` | `text` | An event's title. |
| `--timeline-time-color` | `text-muted` | An event's time (4.5:1 on the page). |
| `--timeline-line` | `border` | The line joining the markers. |
| `--timeline-dot-neutral` | `border-strong` | The dot of a neutral event. |
| `--timeline-icon-neutral` | `text-muted` | The icon of a neutral event (3:1 on its circle). |
| `--timeline-icon-bg-neutral` | `surface-muted` | The circle behind a neutral event's icon. |
| `--timeline-dot-primary` | `primary` | The dot of a primary event. |
| `--timeline-icon-primary` | `primary` | The icon of a primary event (3:1 on its circle). |
| `--timeline-icon-bg-primary` | `primary-subtle` | The circle behind a primary event's icon. |
| `--timeline-dot-success` | `success` | The dot of a success event. |
| `--timeline-icon-success` | `success-text` | The icon of a success event (3:1 on its circle). |
| `--timeline-icon-bg-success` | `success-subtle` | The circle behind a success event's icon. |
| `--timeline-dot-warning` | `warning` | The dot of a warning event. |
| `--timeline-icon-warning` | `warning-text` | The icon of a warning event (3:1 on its circle). |
| `--timeline-icon-bg-warning` | `warning-subtle` | The circle behind a warning event's icon. |
| `--timeline-dot-danger` | `danger` | The dot of a danger event. |
| `--timeline-icon-danger` | `danger-text` | The icon of a danger event (3:1 on its circle). |
| `--timeline-icon-bg-danger` | `danger-subtle` | The circle behind a danger event's icon. |
| `--timeline-dot-info` | `info` | The dot of a info event. |
| `--timeline-icon-info` | `info-text` | The icon of a info event (3:1 on its circle). |
| `--timeline-icon-bg-info` | `info-subtle` | The circle behind a info event's icon. |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--timeline-line-width` | `border-width-2` | The line's width (2px). |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--timeline-marker-size` | `spacing-6` | The marker's box, and the title's line height (24px). |
| `--timeline-dot-size` | `spacing-2.5` | The dot, when there's no icon (10px). |
| `--timeline-icon-size` | `spacing-4` | An icon in the marker (16px). |
| `--timeline-gap` | `spacing-3` | Between the marker and the body (12px). |
| `--timeline-item-gap` | `spacing-6` | Between one event and the next (24px). |
<!-- token-table:end -->
