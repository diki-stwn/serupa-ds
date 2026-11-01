# HoverCard

A preview of what a link points to: a person, a page, a repository. It opens when the pointer rests on the link, or keyboard focus stays on it, so people can check who or what it is before they follow it.

```tsx
import { HoverCard, Link, Avatar } from "serupa-ds";

<HoverCard trigger={<Link href="/people/dewi">@dewi</Link>}>
  <Avatar name="Dewi Lestari" /> <strong>Dewi Lestari</strong>
  <p>Design lead, Payments</p>
  <Link href="/people/dewi/projects">See Dewi's projects</Link>
</HoverCard>
```

## When to use

- A mention, an author's name or a link to a record, where a glance at the details saves a trip to another page.

## When not to use

- A short hint about a control: use [Tooltip](../Tooltip/README.md).
- Something people open on purpose to act on (a form, filters, settings): use [Popover](../Popover/README.md), which opens on a press.
- Anything that only exists in the card. A touch screen has no hover, so the card never opens there, and the link goes straight to its page. Everything in the card must also be on the page the link opens.

## Usage

- The trigger is one element that takes focus, usually a link. The card adds nothing to its name: it's a preview, not part of the link.
- Keep the card short: a name, a picture, a line or two and a link or two. It's 320px wide and grows taller, scrolling inside itself past the screen's height.
- It waits 500ms before opening (`openDelay`), so a pointer crossing a list of links doesn't open a card for each. It closes 300ms after the pointer and focus leave both the link and the card (`closeDelay`), so crossing the gap to the card keeps it.

## Accessibility

- **Role and name:** the card is a plain group in the top layer, placed right after the link in the page's order, so a screen reader's reading order reaches it after the link while it's open. The link's own name and target are unchanged.
- **Keyboard:** focus resting on the link opens the card after `openDelay` (keyboard focus only, not a click). Tab then goes into the card, and Shift+Tab back to the link. Focus leaving both closes it. Escape closes it from anywhere and, from inside the card, puts focus back on the link (WCAG 1.4.13: dismissible, hoverable, persistent).
- **Pointer:** the pointer can move from the link onto the card, and the card stays while it's there.
- **Contrast:** its text reads 4.5:1 on its background in all six themes (`HoverCard.test.tsx`).
- **What's still yours:** the same details reachable without hover (the page the link opens), and links in the card with names that make sense on their own.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `trigger` | `ReactElement` | | The link it previews: one element that takes focus. |
| `children` | `ReactNode` | | What the card shows. Links and buttons are fine. |
| `placement` | `Placement` | `'bottom'` | `'top'`, `'bottom'`, `'left'`, `'right'`, with `'-start'` or `'-end'`. It flips when there's no room. |
| `openDelay` | `number` | `500` | Milliseconds the pointer or focus rests on the link before it opens. |
| `closeDelay` | `number` | `300` | Milliseconds after the pointer and focus leave the link and the card before it closes. |
| `open` | `boolean` | | Controlled, with `onOpenChange`. |
| `defaultOpen` | `boolean` | `false` | Open at first (uncontrolled). |
| `onOpenChange` | `(open, { reason }) => void` | | `reason`: `'hover'`, `'focus'`, `'blur'`, `'escape'` or `'outside'`. |
| `disabled` | `boolean` | `false` | Never opens. |
| `id` | `string` | generated | The card's id. |

`className`, `style`, `ref` and other props go to the card's `<div>`.

## Component tokens

Each is an optional override: set it on the page, a container or one HoverCard. The list lives in `src/components/HoverCard/hover-card.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from hover-card.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--hover-card-bg` | `surface-overlay` | The card's background. |
| `--hover-card-text` | `text` | The card's text (4.5:1 on bg). |
| `--hover-card-border` | `border-overlay` | The card's border. |
| `--hover-card-shadow` | `shadow-lg` | The card's shadow. |
| `--hover-card-radius` | `rounded-lg` | The corners (8px). |
| `--hover-card-border-width` | `border-width-1` | The border's width (1px). |
| `--hover-card-width` | `container-xs` | The card's width (320px), never wider than the screen. |
| `--hover-card-padding` | `spacing-4` | Space inside, on every side (16px). |
| `--hover-card-offset` | `spacing-2` | The gap between the link and the card (8px). |
| `--hover-card-z-index` | `z-popover` | Its stacking level, for a browser without the top layer. |
<!-- token-table:end -->
