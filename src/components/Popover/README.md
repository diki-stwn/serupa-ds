# Popover

A small panel next to its trigger for content people interact with: a short form, filters, details with links. It's a non-modal dialog: the rest of the page stays usable, and it closes on Escape, a click outside, or when focus moves elsewhere.

```jsx
const { Popover, Button, Field, Input } = window.Serupa;

<Popover title="Share" trigger={<Button variant="outline" leftIcon="share">Share</Button>}>
  {(close) => (
    <form onSubmit={(e) => { e.preventDefault(); invite(); close(); }}>
      <Field label="Email"><Input type="email" /></Field>
      <Button type="submit">Invite</Button>
    </form>
  )}
</Popover>

<Popover aria-label="About billing" placement="right-start" initialFocus="panel"
  trigger={<IconButton icon="info" label="About billing" />}>
  You're billed on the 1st of each month.
</Popover>
```

## When to use

- A short form tied to one control, such as sharing with an email address or renaming in place.
- Filters or settings people adjust and then close, while the page stays in view.
- Details with links or buttons about one item, such as a person's card or an explanation with a "Learn more" link.

## When not to use

- A short hint: use [Tooltip](../Tooltip/README.md) instead.
- A list of actions: use [Menu](../Menu/README.md) instead.
- Something people must finish or dismiss before going on: use [Dialog](../Dialog/README.md) instead.

## Usage

- Keep it small: a few fields or a short paragraph. If it needs scrolling, use a [Drawer](../Drawer/README.md) or a [Dialog](../Dialog/README.md).
- Give it a `title`, or an `aria-label` when there's none, so it has a name.
- Use the function form of `children` to close it from a Done, Cancel or submit button.
- When it holds only text, set `initialFocus="panel"`: there's no control inside to focus.

## Accessibility

- The panel is a `role="dialog"` named by its title (or `aria-label`); the trigger has `aria-expanded` and `aria-controls`.
- Opening moves focus inside; Escape and `close()` return it to the trigger. It sits right after the trigger in the tab order, so Tab moves from the trigger into it.
- A click outside or focus moving elsewhere closes it, without moving focus.
- Text and the title keep 4.5:1 on the panel in all six themes (`Popover.test.tsx`). With reduced motion it appears without growing in.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `trigger` | element | required | One element that can take focus; it gets `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls` |
| `children` | node, or `(close) => node` | required | The content. The function form gets `close()` for a Done or Cancel button |
| `title` | node | none | A heading at the top that names it |
| `placement` | `'bottom'`, `'top'`, `'left'`, `'right'`, each with `-start` or `-end` | `'bottom'` | Where it goes; it flips and shifts to stay on screen, and with no room on either side it takes the roomier one and scrolls inside. On the left or right, a popover wider than the room beside its trigger gets that width and wraps |
| `open`, `onOpenChange` | boolean, function | none | Open it yourself (controlled) |
| `defaultOpen` | boolean | `false` | Open at first (uncontrolled) |
| `aria-label` | string | none | Its name when there's no title |
| `initialFocus` | `'first'` \| `'panel'` | `'first'` | Focus the first control inside, or the panel itself (for text only) |
| `className`, `style` | | | Go to the panel, which has `data-component="popover"` and `data-side` |

## Component tokens

Each is an optional override: set it on the page, a container or one popover. The list lives in `src/components/Popover/popover.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--popover-bg` | `surface-overlay` | The panel's background. |
| `--popover-text` | `text` | The panel's text. |
| `--popover-border` | `border-overlay` | The panel's border. |
| `--popover-title-color` | `text` | The title. |
| `--popover-focus-ring` | `focus-ring` | The panel's focus ring, when it takes focus itself. |
| `--popover-shadow` | `shadow-lg` | The panel's shadow. |
| `--popover-radius` | `rounded-lg` | The panel's corners (8px). |
| `--popover-border-width` | `border-width-1` | The panel's border (1px). |
| `--popover-title-size` | `text-sm` | The title (14px). |
| `--popover-title-weight` | `font-semibold` | The title's weight (600). |
| `--popover-width` | `container-3xs` | The panel's width (256px; it never gets wider than the screen). |
| `--popover-padding` | `spacing-4` | Space inside the panel (16px). |
| `--popover-gap` | `spacing-2` | Space under the title (8px). |
| `--popover-offset` | `spacing-2` | The gap between the panel and its trigger (8px). |
| `--popover-z-index` | `z-50` | The stacking level where the browser has no top layer (popover). |
